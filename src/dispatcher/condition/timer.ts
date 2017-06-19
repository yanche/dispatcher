
import { ConditionHandler } from "./def";
import * as utility from "../../utility";

const timer: ConditionHandler = {
    resolve(pack: number): Promise<boolean> {
        if (!timer.validate(pack))
            return Promise.reject(new Error(`condition.timer, bad input: ${pack}`));
        else
            return Promise.resolve(new Date().getTime() >= pack);
    },
    validate(pack: number): boolean {
        return utility.validate.pos(pack, true) && (new Date(pack).getTime() === pack);
    }
}

export default timer;
