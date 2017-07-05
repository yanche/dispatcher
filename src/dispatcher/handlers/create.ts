
import { CreateDataModel } from "./def";
import { Context, Request } from "../def";
import { status, cond, constraints, Task, Condition, Constraint } from "../../def";
import * as utility from "../../utility";
import * as condition from "../condition";

export async function createOne(ctx: Context<Task>, next: () => any, colc: utility.mongo.CollClient<Task>) {
    const model = new TaskCreateModel(ctx.request.body);
    if (model.valid) {
        const objId = await colc.createOne(model.mongoDoc);
        ctx.body = { _id: objId.toHexString() };
        await next();
    }
    else {
        ctx.status = 400;
        ctx.message = "invalid http body to create a new task";
    }
}

export async function createMul(ctx: Context<{ list: Task[] }>, next: () => any, colc: utility.mongo.CollClient<Task>) {
    if (!ctx.request.body || !Array.isArray(ctx.request.body.list) || ctx.request.body.list.length === 0) {
        ctx.state = 400;
        ctx.message = "invalid http body to create tasks";
    }
    else {
        const models = ctx.request.body.list.map(d => new TaskCreateModel(d));
        const badIdx = models.map((d, idx) => { return { idx: idx, valid: d.valid }; }).filter(m => !m.valid).map(d => d.idx);
        if (badIdx.length > 0) {
            ctx.status = 400;
            ctx.message = `invalid http body to create a new task, bad indexes: ${badIdx.join(" ")}`;
        }
        else {
            const objIds = await colc.bulkInsert(models.map(m => m.mongoDoc));
            ctx.body = { list: objIds.map(o => o.toHexString()) };
            await next();
        }
    }
}

class TaskCreateModel extends CreateDataModel<Task> {
    constructor(body: Task) {
        super();
        if (!body) {
            this._valid = false;
            return;
        }
        const nowTs = new Date().getTime();
        const mdoc: Task = this._mongodoc = {
            _id: body._id ? utility.mongo.convObjId(body._id) : utility.mongo.newId(),
            condition: body.condition,
            constraints: body.constraints,
            action: body.action,
            comments: body.comments || "",
            statusId: status.new,
            createdTs: nowTs,
            processLog: [{ msg: "newly created", ts: nowTs }],
            lastProcessTs: null,
            result: null,
            priority: 0,
            assigned: 0,
            locality: body.locality || null
        };
        this._valid = mdoc._id && condition.validate(mdoc.condition) && validateConstraints(mdoc.constraints)
            && utility.validate.isObj(mdoc.action) && utility.validate.isStr(mdoc.action.type)
            && utility.validate.isStr(mdoc.comments) && (mdoc.locality === null || utility.validate.isObj(mdoc.locality));
        if (this._valid) {
            mdoc.statusId = newTaskStatusByCondition(mdoc.condition);
        }
    }
}

function validateConstraints(cons: Constraint): boolean {
    return utility.validate.isObj(cons) &&
        (cons.timeoutLevel === constraints.timeoutLevel.exlong.code ||
            cons.timeoutLevel === constraints.timeoutLevel.long.code ||
            cons.timeoutLevel === constraints.timeoutLevel.medium.code ||
            cons.timeoutLevel === constraints.timeoutLevel.short.code)
        && (cons.conditionCheckInterval === constraints.conditionCheckInterval.exlong.code ||
            cons.conditionCheckInterval === constraints.conditionCheckInterval.long.code ||
            cons.conditionCheckInterval === constraints.conditionCheckInterval.medium.code ||
            cons.conditionCheckInterval === constraints.conditionCheckInterval.short.code)
        && utility.validate.pos(cons.ttl, true);
}

function newTaskStatusByCondition(taskcond: Condition) {
    return taskcond.type === cond.ok ? status.prepared : status.new;
};
