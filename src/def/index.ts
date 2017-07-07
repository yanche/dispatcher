
import * as mongo from "mongodb";

export const status = {
    new: 1,
    conditionCheckInterval: 2,
    prepared: 3,
    processing: 4,
    success: 5,
    failed: 6,
    timeout: 7,
    closed: 8,
    abandoned: 9
};

export const constraints = {
    timeoutLevel: {
        short: {
            code: 1,
            ms: 1000 * 60 //1 min
        },
        medium: {
            code: 2,
            ms: 1000 * 60 * 5 //5 min
        },
        long: {
            code: 3,
            ms: 1000 * 60 * 30 //30 min
        },
        exlong: {
            code: 4,
            ms: 1000 * 60 * 60 * 4 //4 hour
        }
    },
    conditionCheckInterval: {
        short: {
            code: 1,
            ms: 1000 * 5 //5 sec
        },
        medium: {
            code: 2,
            ms: 1000 * 30 //30 sec
        },
        long: {
            code: 3,
            ms: 1000 * 60 * 5 //5 min
        },
        exlong: {
            code: 4,
            ms: 1000 * 60 * 60 //1 hour
        }
    }
}

export const cond = {
    ok: "ok",
    success: "success",
    complete: "complete",
    timer: "timer",
    and: "and",
    or: "or"
}

export interface Condition {
    type: string;
    pack?: any;
}

export interface Constraint {
    ttl?: number;
    conditionCheckInterval?: number;
    timeoutLevel?: number
}

export interface Action {
    type: string;
    pack?: any;
}

export interface Task {
    _id?: mongo.ObjectID | string;
    condition?: Condition;
    constraints?: Constraint;
    action?: Action;
    comments?: string;
    statusId?: number;
    createdTs?: number;
    processLog?: Array<{ msg: string; ts: number; err?: string }>;
    lastProcessTs?: number;
    nextConditionCheckTs?: number;
    lastConditionCheckTs?: number;
    result?: Object;
    priority?: number;
    assigned?: number;
    locality?: Object;
}

export const verb = {
    CREATEMUL: "CREATEMUL",
    CREATEONE: "CREATEONE",
    GETMUL: "GETMUL",
    GETONE: "GETONE",
    REPORT: "REPORT",
    DISPATCH: "DISPATCH",
    UPGRADE: "UPGRADE",
    CLOSE: "CLOSE",
    RENEW: "RENEW",
    MAKEREADY: "MAKEREADY"
}

export interface DispatchAsk {
    // mongo filter
    limit: Object;
    // array of mongo filter, will be concatenated by $or operator
    preference: Array<Object>;
}
