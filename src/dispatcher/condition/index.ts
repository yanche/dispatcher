
import * as logic from "./logic";
import success from "./success";
import complete from "./complete";
import ok from "./ok";
import timer from "./timer";
import { cond, Condition, Task } from "../../def";
import { ConditionHandler } from "./def";
import { CollClient } from "@belongs/mongoutil";

export async function resolve(cond: Condition, colc: CollClient<Task>): Promise<boolean> {
    const condhandler = condmap.get(cond.type);
    if (!condhandler) {
        throw new Error(`condition not found for type: ${cond.type}`);
    }
    else {
        return await condhandler.resolve(cond.pack, colc);
    }
}

export function validate(cond: Condition): boolean {
    const condhandler = condmap.get(cond.type);
    return condhandler && condhandler.validate(cond.pack);
}

const condmap = new Map<string, ConditionHandler>();
condmap.set(cond.ok, ok);
condmap.set(cond.success, success);
condmap.set(cond.complete, complete);
condmap.set(cond.timer, timer);
condmap.set(cond.or, logic.or);
condmap.set(cond.and, logic.and);
