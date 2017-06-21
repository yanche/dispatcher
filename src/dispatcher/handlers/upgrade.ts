
import { Context, Task } from "../def";
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
            const task = await colc.getOne({ _id: objId }, { priority: 1 });
            if (!task) {
                ctx.status = 404;
                ctx.message = "task not found";
            }
            else if (task.priority > 0) {
                ctx.status = 400;
                ctx.message = "task is already prioritized";
            }
            else {
                await colc.updateAll({ _id: objId }, { $set: { priority: 1 }, $push: { processLog: { ts: new Date().getTime(), msg: "task was upgraded" } } }, false);
                await next();
            }
        }
    }
}
