
import * as koa from "koa";

export interface Context<T> extends koa.Context {
    request: Request<T>;
}

export interface Request<T> extends koa.Request {
    body: T;
}
