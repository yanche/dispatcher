
import * as Koa from "koa";

export interface Handler {
    (ctx: Koa.Context): Promise<void>;
}
