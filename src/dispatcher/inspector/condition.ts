
import * as utility from "../../utility";
import { constraints, status, Task } from "../../def";
import * as condition from "../condition";
import roll from "croll";

function getConditionCheckInterval(code: number): number {
    switch (code) {
        case constraints.conditionCheckInterval.short.code:
            return constraints.conditionCheckInterval.short.ms;
        case constraints.conditionCheckInterval.medium.code:
            return constraints.conditionCheckInterval.medium.ms;
        case constraints.conditionCheckInterval.long.code:
            return constraints.conditionCheckInterval.long.ms;
        case constraints.conditionCheckInterval.exlong.code:
            return constraints.conditionCheckInterval.exlong.ms;
        default:
            return constraints.conditionCheckInterval.medium.ms;
    }
}

export default function checkPreCondition(colc: utility.mongo.CollClient<Task>, conditionCheckFreqMS: number) {
    console.log("now inspecting the task pre-condition");
    Promise.all([
        colc.getMul({ statusId: status.new }, { condition: 1, _id: 1, constraints: 1 }, null, 0, 20),
        colc.getMul({ statusId: status.conditionCheckInterval, nextConditionCheckTs: { $lt: new Date().getTime() } }, { condition: 1, _id: 1, constraints: 1 }, { lastConditionCheckTs: 1 }, 0, 20)
    ])
        .then(data => {
            const tasks = data[0].concat(data[1]);
            if (tasks.length > 0) {
                console.log(`now checking pre-condition of ${tasks.length} tasks`);
                roll<Task, void>(tasks, async task => {
                    try {
                        let cond: boolean = false;
                        try {
                            cond = await condition.resolve(task.condition, colc);
                        }
                        catch (err) {
                            console.log(err.stack);
                            await colc.updateAll({ _id: task._id }, { $set: { statusId: status.abandoned }, $push: { processLog: { ts: new Date().getTime(), msg: "got an error when check task pre-condition, mark as abandoned status" } } }, false);
                            return;
                        }
                        if (cond)
                            await colc.updateAll({ _id: task._id }, { $set: { statusId: status.prepared }, $push: { processLog: { ts: new Date().getTime(), msg: "set status to prepared" } } }, false);
                        else
                            await colc.updateAll({ _id: task._id }, { $set: { statusId: status.conditionCheckInterval, lastConditionCheckTs: new Date().getTime(), nextConditionCheckTs: utility.date.dateOffset(new Date().getTime(), { ms: getConditionCheckInterval(task.constraints.conditionCheckInterval) }).getTime() } }, false);
                    }
                    catch (err) {
                        console.error("pre-condition inspector got Error");
                        console.error(err.stack);
                    }
                }, Math.min(10, tasks.length));
            }
        })
        .catch((err: Error) => {
            console.error("unhandled error in task condition inspector");
            console.error(err.stack);
        })
        .then(() => setTimeout(checkPreCondition, conditionCheckFreqMS));
}
