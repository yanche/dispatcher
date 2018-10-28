
import { Task } from "../def";
import { CollClient, DbClient } from "@belongs/mongoutil";

export function createMongoCollClient(connstr: string): CollClient<Task> {
    const dbc = new DbClient(connstr);
    return dbc.getCollClient<Task>(colName, taskFields);
}

const one: 1 = 1;

const taskFields = {
    _id: one,
    locality: one,
    condition: one,
    action: one,
    postAction: one,
    constraints: one, //timeout level(timeoutLevel), pre condition check interval(conditionCheckInterval), time to live(retry quota left, ttl)
    comments: one,
    statusId: one,
    createdTs: one,
    processLog: one,
    lastProcessTs: one,
    nextConditionCheckTs: one,
    lastConditionCheckTs: one,
    result: one,
    priority: one,
    assigned: one, //count of assignment
}

const colName = "task";
