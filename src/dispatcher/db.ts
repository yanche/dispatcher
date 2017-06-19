
import * as utility from "../utility";
import * as def from "./def";

export function createMongoCollClient(connstr: string): utility.mongo.CollClient<def.Task> {
    const dbc = new utility.mongo.DbClient(connstr);
    return dbc.getCollClient<def.Task>(colName, taskFields);
}

const taskFields = {
    _id: 1,
    locality: 1,
    condition: 1,
    action: 1,
    postAction: 1,
    constraints: 1, //timeout level(timeoutLevel), pre condition check interval(conditionCheckInterval), time to live(retry quota left, ttl)
    comments: 1,
    statusId: 1,
    createdTs: 1,
    processLog: 1,
    lastProcessTs: 1,
    nextConditionCheckTs: 1,
    lastConditionCheckTs: 1,
    quickview: 1,
    priority: 1,
    assigned: 1, //count of assignment
}

const colName = "task";
