
import * as Koa from "koa";
import * as handlers from "./handlers";
import { Task } from "../def";
import { Context } from "./def";
import * as db from "./db";
import * as utility from "../utility";
import { CollClient } from "@belongs/mongoutil";
import conditionInspect from "./inspector/condition";
import timeoutInspect from "./inspector/timeout";
import { MongoClientOptions } from "mongodb";

export default class Dispatcher {
    private _port: number;
    private _started: boolean;
    private _koa: Koa;
    private _colc: CollClient<Task>;

    constructor(port: number, mongoConnStr: string, mongoOptions?: MongoClientOptions) {
        this._port = port;
        this._started = false;
        this._koa = this._koaInit();
        this._colc = db.createMongoCollClient(mongoConnStr, mongoOptions);
    }

    start(): void {
        if (this._started) {
            throw new Error(`dispatcher already started at port: ${this._port}`);
        }
        else {
            this._started = true;
            this._koa.listen(this._port);
            conditionInspect(this._colc, 2000); // check task pre-condition every 2s
            timeoutInspect(this._colc, 2300); // check task timeout every 2.3s
        }
    }

    private _koaInit(): Koa {
        const koa = new Koa();
        koa.use(async (ctx, next) => {
            ctx.status = 200; // set default status code return to 200 instead of 404
            if (ctx.method.toUpperCase() !== "OPTIONS") {
                await next();
            }
            ctx.set("Access-Control-Allow-Credentials", "true");
            ctx.set("Access-Control-Allow-Headers", "Content-Type,Verb");
            ctx.set("Access-Control-Allow-Methods", "POST,OPTIONS");
            ctx.set("Access-Control-Allow-Origin", "*");
            ctx.set("Access-Control-Max-Age", "3600");
        });
        koa.use(async (ctx: Context<any>, next) => {
            // parse http body
            const bodybuf = await utility.stream.getData(ctx.req);
            if (ctx.is("json")) {
                try {
                    ctx.request.body = JSON.parse(bodybuf.toString("utf8"));
                    await next();
                }
                catch (err) {
                    ctx.status = 400;
                    ctx.message = (<Error>err).message;
                }
            }
            else {
                ctx.request.body = bodybuf;
                await next();
            }
        });
        koa.use(async (ctx, next) => {
            // process according to verb header
            const verb: string = ctx.header["verb"];
            const handler = handlers.findHandler(verb);
            if (!handler) {
                ctx.status = 404;
                ctx.message = `invalid verb: ${verb}`;
            }
            else {
                await handler(ctx, next, this._colc);
            }
        });
        return koa;
    }
}
