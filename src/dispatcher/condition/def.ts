
import { Task } from "../../def";
import { CollClient } from "@belongs/mongoutil";

export interface ConditionHandler {
    resolve(pack: any, colc: CollClient<Task>): Promise<boolean>;
    validate(pack: any): boolean;
}
