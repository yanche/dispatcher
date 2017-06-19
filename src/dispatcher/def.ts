
import * as koa from "koa";
import * as mongo from "mongodb";

export interface Context<T> extends koa.Context {
    request: Request<T>;
}

export interface Request<T> extends koa.Request {
    body: T;
}

export const task = {
    status: {
        new: 1,
        conditionCheckInterval: 2,
        prepared: 3,
        processing: 4,
        success: 5,
        failed: 6,
        timeout: 7,
        closed: 8,
        abandoned: 9
    },
    constraints: {
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
}

export interface Task {
    _id?: mongo.ObjectID | string;
    condition?: { type: string; pack?: any };
    action?: { type: string; pack?: any };
    constraints?: { ttl?: number; conditionCheckInterval?: number; timeoutLevel?: number };
    comments?: string;
    statusId?: number;
    createdTs?: number;
    processLog?: Array<{ msg: string; ts: number; err?: string }>;
    lastProcessTs?: number;
    // nextConditionCheckTs?: number;
    // lastConditionCheckTs?: number;
    result?: Object;
    priority?: number;
    assigned?: number;
}