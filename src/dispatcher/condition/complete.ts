
import { ConditionHandler } from "./def";
import { Task, status } from "../../def";
import * as utility from "../../utility";
import { CollClient } from "@belongs/mongoutil";

const complete: ConditionHandler = {
    resolve(pack: Array<string> | string, colc: CollClient<Task>): Promise<boolean> {
        return Promise.resolve().then(() => {
            if (!complete.validate(pack)) throw new Error("condition.complete, bad input");
            let filter: Object = null;
            if (Array.isArray(pack))
                filter = { $in: pack.map(utility.mongo.convObjId) };
            else
                filter = utility.mongo.convObjId(pack);
            return Promise.all([
                colc.count({ _id: filter }),
                colc.getOne(
                    {
                        $and: [
                            { _id: filter },
                            { statusId: { $ne: status.success } },
                            {
                                $or: [
                                    { statusId: { $ne: status.failed } },
                                    { "constraints.ttl": { $gt: 0 } }
                                ]
                            }
                        ]
                    },
                    { _id: 1 })
            ])
                .then(d => {
                    const expcount = Array.isArray(pack) ? pack.length : 1;
                    if (d[0] === expcount) return !d[1];
                    else throw new Error(`condition.complete, count not match, expected: ${expcount}, actual: ${d[0]}`);
                })
        });
    },
    validate(pack: Array<string> | string): boolean {
        if (Array.isArray(pack)) {
            return pack.length > 0 && utility.array.unique(pack).length === pack.length && pack.every(p => utility.validate.isStr(p) && !!utility.mongo.convObjId(p));
        }
        else {
            return utility.validate.isStr(pack) && !!utility.mongo.convObjId(pack);
        }
    }
}

export default complete;
