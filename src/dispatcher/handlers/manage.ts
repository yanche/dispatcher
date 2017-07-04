
import { Context } from "../def";
import { status, Task } from "../../def";
import { CollClient, convObjId } from "../../utility/mongo";

function makeManageHandler(validate: (task: Task) => boolean, work: (task: Task, colc: CollClient<Task>) => Promise<any>) {
    return async function (ctx: Context<{ _id: string }>, next: () => any, colc: CollClient<Task>) {
        if (!ctx.request.body) {
            ctx.status = 400;
            ctx.message = "http body must contains task._id";
        }
        else {
            const objId = convObjId(ctx.request.body._id);
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
                else if (!validate(task)) {
                    ctx.status = 400;
                    ctx.message = "task is not qualified for action";
                }
                else {
                    await work(task, colc);
                    await next();
                }
            }
        }
    }
}

function makeStatusUpdateHandler(validate: (task: Task) => boolean, statusId: number, msg: string, ttlrenew: boolean) {
    return makeManageHandler(validate, async (task: Task, colc: CollClient<Task>) => {
        const updateObj: any = {
            $set: { statusId: statusId, nextConditionCheckTs: null },
            $push: { processLog: { ts: new Date().getTime(), msg: msg } }
        };
        if (ttlrenew && task.constraints.ttl < 1) {
            updateObj.$set["constraints.ttl"] = 1;
        }
        await colc.updateAll({ _id: task._id }, updateObj, false);
    });
}

export const close = makeStatusUpdateHandler((task: Task) => {
    return !((task.statusId === status.failed && task.constraints.ttl === 0) || [status.success, status.closed, status.abandoned].some(s => s === task.statusId));
}, status.closed, "task was closed", false);

export const upgrade = makeManageHandler((task: Task) => {
    return !(task.priority > 0);
}, async (task: Task, colc: CollClient<Task>) => {
    await colc.updateAll({ _id: task._id }, { $set: { priority: 1 }, $push: { processLog: { ts: new Date().getTime(), msg: "task was upgraded" } } }, false);
});

export const makeready = makeStatusUpdateHandler((task: Task) => {
    return task.statusId !== status.prepared;
}, status.prepared, "task was marked as ready", true);

export const renew = makeStatusUpdateHandler((task: Task) => {
    return task.statusId !== status.new;
}, status.new, "task was renewed", true);
