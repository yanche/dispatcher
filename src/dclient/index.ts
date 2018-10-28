
import { Task, Action, Condition, Constraint, cond, constraints, verb, DispatchAsk } from "../def";
import * as mongo from "mongodb";
import * as utility from "../utility";
import * as http from "http";

export interface TaskCreation {
    _id?: string | mongo.ObjectID;
    action: Action;
    condition?: Condition;
    constraints?: Constraint;
    comments?: string;
    locality?: Object;
    priority?: 1 | 0;
}

export class DispatcherClient {
    private _host: string;
    private _port: number;
    private _createMulPageSize = 200;
    constructor(host: string, port: number) {
        this._host = host;
        this._port = port;
    }

    public getAllById(idList: Array<string | mongo.ObjectID>, fields?: Object): Promise<{ list: Array<Task> }> {
        const pageSize = 15;
        const pages = Math.ceil(idList.length / pageSize);
        const result: Array<Array<Task>> = [];
        let i = 0;
        return utility.whileLoop(() => Promise.resolve(i < pages), () => {
            return this.getMul({ _id: { $in: idList.slice(pageSize * i, (i + 1) * pageSize) } }, 1, pageSize, fields, null)
                .then(data => result.push(data.list))
                .then(() => ++i);
        })
            .then(() => { return { list: utility.array.flatten(result) }; });
    }

    public getMul(filter: Object, page: number, pageSize: number, fields?: Object, orderby?: Object): Promise<{ list: Array<Task>, page: number, pageSize: number, total: number }> {
        return this._expectJson<{ list: Array<Task>, page: number, pageSize: number, total: number }>({ filter: filter, fields: fields, page: page, pageSize: pageSize, orderby: orderby }, verb.GETMUL);
    }

    public getOne(filter: Object, fields?: Object, orderby?: Object): Promise<Task> {
        return this._expectJson<Task>({ filter: filter, fields: fields, orderby: orderby }, verb.GETONE);
    }

    public createOne(data: TaskCreation): Promise<{ _id: string }> {
        return this._expectJson<{ _id: string }>(refineTaskCreationArg(data), verb.CREATEONE);
    }

    public createMul(list: Array<TaskCreation>): Promise<{ list: Array<string> }> {
        list = list.map(refineTaskCreationArg);
        const ret = new Array<Array<string>>();
        const totalPages = Math.ceil(list.length / this._createMulPageSize);
        let i = 0;
        return utility.whileLoop(() => Promise.resolve(i < totalPages), () => {
            return this._expectJson<{ list: Array<string> }>({ list: list.slice(i * this._createMulPageSize, (i + 1) * this._createMulPageSize) }, verb.CREATEMUL)
                .then(data => ret.push(data.list))
                .then(() => ++i);
        })
            .then(() => {
                return {
                    list: utility.array.flatten(ret)
                };
            })
    }

    public dispatch(data: DispatchAsk): Promise<Task> {
        return this._req(data, verb.DISPATCH)
            .then(reply => {
                if (reply.statusCode == 404) {
                    return null;
                }
                else if (reply.statusCode === 200) {
                    return JSON.parse(reply.data.toString("utf8"));
                }
                else {
                    throw new Error(`bad server return in task dispatch: ${reply.statusCode}`);
                }
            });
    }

    public report(data: { _id: string | mongo.ObjectID, processTs: number, statusId: number, recoverable?: boolean, errmsg?: string, result?: any }): Promise<void> {
        return this._req(data, verb.REPORT)
            .then(reply => {
                if (reply.statusCode !== 200) {
                    throw new Error(`report task status failed with statuscode: ${reply.statusCode}`);
                }
            });
    }

    public renew(_id: string | mongo.ObjectID): Promise<void> {
        return this._singleTaskOp(_id, verb.RENEW);
    }

    public close(_id: string | mongo.ObjectID): Promise<void> {
        return this._singleTaskOp(_id, verb.CLOSE);
    }

    public makeReady(_id: string | mongo.ObjectID): Promise<void> {
        return this._singleTaskOp(_id, verb.MAKEREADY);
    }

    public upgrade(_id: string | mongo.ObjectID): Promise<void> {
        return this._singleTaskOp(_id, verb.UPGRADE);
    }

    private _singleTaskOp(_id: string | mongo.ObjectID, verb: string): Promise<void> {
        return this._req({ _id: _id }, verb)
            .then(reply => {
                if (reply.statusCode === 200) {
                    return;
                }
                else {
                    throw new Error(`return statuscode not 200: ${reply.statusCode}`);
                }
            });
    }

    private _expectJson<T>(body: Object | Buffer | string, verb: string): Promise<T> {
        return this._req(body, verb)
            .then(reply => {
                if (reply.statusCode === 200) {
                    try {
                        return JSON.parse(reply.data.toString("utf8"));
                    }
                    catch (err) {
                        throw new Error("failed to parse returned data to json");
                    }
                }
                else {
                    throw new Error(`return statuscode not 200: ${reply.statusCode}`);
                }
            });
    }

    private _req(body: Object | Buffer | string, verb: string): Promise<WebReqReturn> {
        return new Promise<WebReqReturn>((resolve, reject) => {
            const req = http.request({
                method: "POST",
                headers: { verb: verb },
                path: "/",
                host: this._host,
                port: this._port,
            }, res => {
                utility.stream.getData(res)
                    .then(buf => {
                        resolve({
                            statusCode: res.statusCode,
                            headers: <{ [key: string]: string }>res.headers,
                            data: buf
                        });
                    })
                    .catch(reject);
            })
                .on("aborted", () => reject(new Error("client request was aborted by server")))
                .on("error", reject);
            if (body && utility.validate.isObj(body)) {
                req.setHeader("Content-Type", "application/json");
                req.end(JSON.stringify(body));
            }
            else {
                if (utility.validate.isStr(body)) {
                    req.setHeader("Content-Type", "text/plain");
                }
                req.end(body);
            }
        });
    }
}

interface WebReqReturn {
    statusCode: number;
    headers: { [key: string]: string };
    data: Buffer;
}

function refineTaskCreationArg(task: TaskCreation): TaskCreation {
    return {
        _id: task._id,
        action: task.action,
        condition: task.condition || { type: cond.ok },
        constraints: task.constraints || { timeoutLevel: constraints.timeoutLevel.long.code, conditionCheckInterval: constraints.conditionCheckInterval.short.code, ttl: 1 },
        comments: task.comments,
        locality: task.locality || null
    }
}
