
import { ConditionHandler } from "./def";

const ok: ConditionHandler = {
    resolve(): Promise<boolean> {
        return Promise.resolve(true);
    },
    validate(): boolean {
        return true;
    }
}

export default ok;
