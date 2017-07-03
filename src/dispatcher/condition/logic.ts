
import { ConditionHandler } from "./def";
import { Condition, Task } from "../../def";
import * as condition from "./index";
import * as utility from "../../utility";

function validate(pack: Array<Condition>): boolean {
    return Array.isArray(pack) && pack.length > 1 && pack.every(condition.validate);
}

const and: ConditionHandler = {
    resolve(pack: Array<Condition>, colc: utility.mongo.CollClient<Task>): Promise<boolean> {
        if (validate(pack)) {
            return Promise.all(pack.map(p => condition.resolve(p, colc))).then(d => d.every(x => x === true));
        }
        else {
            return Promise.reject(new Error("condition.and: bad input"));
        }
    },
    validate: validate
}

const or: ConditionHandler = {
    resolve(pack: Array<Condition>, colc: utility.mongo.CollClient<Task>): Promise<boolean> {
        if (validate(pack)) {
            return Promise.all(pack.map(p => condition.resolve(p, colc))).then(d => d.some(x => x === true));
        }
        else {
            return Promise.reject(new Error("condition.or: bad input"));
        }
    },
    validate: validate
}

export { and, or };
