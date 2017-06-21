
import { Context, Task, status } from "../def";
import * as utility from "../../utility";

export default async function (ctx: Context<{ _id: string }>, next: () => any, colc: utility.mongo.CollClient<Task>) {
    if (!ctx.request.body) {
        ctx.status = 400;
        ctx.message = "http body must contains task._id";
    }
    else {
        const objId = utility.mongo.convObjId(ctx.request.body._id);
        if (!objId) {
            ctx.status = 400;
            ctx.message = "http body must contains task._id";
        }
        else {
            const task = await colc.getOne({ _id: objId }, { statusId: 1 });
            if (!task) {
                ctx.status = 404;
                ctx.message = "task not found";
            }
            if ((task.statusId === status.failed && task.constraints.ttl === 0) || [status.success, status.closed, status.abandoned].some(s => s === task.statusId)) {
                ctx.status = 400;
                ctx.message = `task status is ${task.statusId}, cannot close it`;
            }
            else {
                await colc.updateAll({ _id: objId }, { $set: { statusId: status.closed }, $push: { processLog: { ts: new Date().getTime(), msg: "task was closed" } } }, false);
                await next();
            }
        }
    }
}
