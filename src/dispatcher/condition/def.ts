
import * as utility from "../../utility";
import { Task } from "../def";

export interface ConditionHandler {
    resolve(pack: any, colc: utility.mongo.CollClient<Task>): Promise<boolean>;
    validate(pack: any): boolean;
}
