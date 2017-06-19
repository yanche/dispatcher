
import * as koa from "koa";
import { DataModel } from "./def";
import { Context, Request, status, Task } from "../def";
import * as utility from "../../utility";

export default async function (ctx: Context<DispatchHttpBody>, next: () => any, colc: utility.mongo.CollClient<Task>) {
    const model = new DispatchModel(ctx.request.body);
    if (model.valid) {
        const task = await dispatch(model.limit, model.preference, true, colc);
        if (task) {
            ctx.body = task;
        }
        else {
            ctx.status = 404;
        }
        await next();
    }
    else {
        ctx.status = 400;
    }
}

function dispatch(limit: Object, preference: Array<Object>, priority: boolean, colc: utility.mongo.CollClient<Task>): Promise<Task> {
    const flt = dispatchFilter(limit, preference, priority), nowts = new Date().getTime();
    return colc.findAndModify(flt, {
        $set: { statusId: status.processing, lastProcessTs: nowts },
        $push: { processLog: { ts: nowts, msg: `dispatched at ${utility.date.datetimeFormat(nowts)}` } },
        $inc: { 'constraints.ttl': -1, assigned: 1 }
    }, null, true, false, { createdTs: 1 })
        .then(task => {
            if (!task) {
                if (priority) {
                    return dispatch(limit, preference, false, colc);
                }
                else {
                    return preference.length > 0 ? dispatch(limit, [], false, colc) : null;
                }
            }
            else {
                return task;
            }
        });
}

function dispatchFilter(limit: Object, preference: Array<Object>, priority: boolean): Object {
    const conds: Array<Object> = [{
        statusId: { $in: [status.prepared, status.timeout, status.failed] },
        'constraints.ttl': { '$gt': 0 }
    }];
    if (priority) conds.push({ priority: 1 });
    if (limit) conds.push(limit);
    if (!priority && preference.length > 0) {
        if (preference.length > 1) {
            conds.push({ $or: preference });
        }
        else {
            conds.push(preference[0]);
        }
    }
    return conds.length > 1 ? { $and: conds } : conds[0];
}

class DispatchModel extends DataModel {
    public limit: Object;
    public preference: Array<Object>;

    constructor(body: DispatchHttpBody) {
        super();
        this._valid = (!this.preference || (Array.isArray(this.preference) && this.preference.every(utility.validate.isObj)))
            && (!this.limit || utility.validate.isObj(this.limit));
        if (this._valid) {
            this.preference = body.preference || [];
            this.limit = body.limit;
        }
    }
}

interface DispatchHttpBody {
    preference: Array<Object>;
    limit: Object;
}
