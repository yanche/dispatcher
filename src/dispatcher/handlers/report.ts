
import { Context, Task, status } from "../def";
import { DataModel } from "./def";
import * as utility from "../../utility";
import * as mongodb from "mongodb";

export default async function (ctx: Context<ReportHttpBody>, next: () => any, colc: utility.mongo.CollClient<Task>) {
    const model = new ReportModel(ctx.request.body);
    if (!model.valid) {
        ctx.status = 400;
        ctx.message = "bad http request body format"
    }
    else {
        const task = await colc.getOne({ _id: model.objId }, { statusId: 1, lastProcessTs: 1 });
        if (!task) {
            ctx.status = 404;
            ctx.message = "task not found";
        }
        else {
            if (task.statusId !== status.processing || task.statusId !== status.timeout) {
                ctx.status = 401;
                ctx.message = `task status: ${task.statusId} is neither processing nor timeout`;
            }
            else if (task.lastProcessTs !== model.processTs) {
                ctx.state = 401;
                ctx.message = "task lastProcessTs does not match the value you provided";
            }
            else {
                if (model.statusId === status.success) {
                    await colc.updateAll({ _id: model.objId }, { $set: { statusId: status.success, result: model.result }, $push: { processLog: { ts: new Date().getTime(), msg: "task finished" } } }, false);
                }
                else {
                    const update: any = { $set: { statusId: status.failed }, $push: { processLog: { ts: new Date().getTime(), msg: "task failed", err: model.errmsg } } };
                    if (model.recoverable)
                        update["$inc"] = { "constraints.ttl": 1 };
                    await colc.updateAll({ _id: model.objId }, update, false);
                }
                await next();
            }
        }
    }
}

class ReportModel extends DataModel {
    public objId: mongodb.ObjectID;
    public processTs: number;
    public statusId: number;
    public recoverable: boolean;
    public errmsg: string;
    public result: any;

    constructor(body: ReportHttpBody) {
        super();
        if (!body) {
            this._valid = false;
        }
        else {
            this.objId = utility.mongo.convObjId(body._id);
            this.processTs = body.processTs;
            this.statusId = body.statusId;
            this.recoverable = body.recoverable || false;
            this.errmsg = body.errmsg || "";
            this.result = body.result || null;
            this._valid = this.objId && utility.validate.pos(this.processTs, true) && new Date(this.processTs).getTime() === this.processTs
                && (this.statusId === status.success || this.statusId === status.failed)
                && utility.validate.isBool(this.recoverable)
                && utility.validate.isStr(this.errmsg);
        }
    }
}

interface ReportHttpBody {
    _id: string;
    processTs: number;
    statusId: number;
    recoverable: boolean;
    errmsg?: string;
    result?: any;
}
