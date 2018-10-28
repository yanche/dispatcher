
import { constraints, status, Task } from "../../def";
import { CollClient } from "@belongs/mongoutil";

export default function checkTimeout(colc: CollClient<Task>, timeoutCheckFreqMS: number) {
    console.log("now inspecting the task timeout");
    const nowts = new Date().getTime();
    Promise.all([
        Promise.all([constraints.timeoutLevel.short, constraints.timeoutLevel.medium, constraints.timeoutLevel.long, constraints.timeoutLevel.exlong].map(c => colc.updateAll({
            statusId: status.processing,
            "constraints.timeoutLevel": c.code,
            lastProcessTs: { $lt: nowts - c.ms }
        }, {
                $set: { statusId: status.timeout },
                $push: { processLog: { ts: nowts, msg: "task timeout" } }
            }, false))),
        colc.updateAll({ statusId: status.timeout, "constraints.ttl": 0 }, { $set: { statusId: status.failed }, $push: { processLog: { ts: nowts, msg: "mark ttl zero and timeout task to failure" } } }, false)
    ])
        .catch((err: Error) => {
            console.error("unhandled error in task timeout inspector");
            console.error(err.stack);
        })
        .then(() => setTimeout(() => checkTimeout(colc, timeoutCheckFreqMS), timeoutCheckFreqMS));
}
