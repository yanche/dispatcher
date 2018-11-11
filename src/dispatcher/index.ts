
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
import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";

export default class Dispatcher {
    private _started: boolean;

    private readonly _port: number;
    private readonly _httpsCertPath: string;
    private readonly _app: Koa;
    private readonly _colc: CollClient<Task>;

    constructor(options: Readonly<{
        port: number;
        mongoConnStr: string;
        httpsCertPath?: string;
        mongoOptions?: MongoClientOptions;
    }>) {
        this._port = options.port;
        this._httpsCertPath = options.httpsCertPath;
        this._started = false;
        this._app = this._koaInit();
        this._colc = db.createMongoCollClient(options.mongoConnStr, options.mongoOptions);
    }

    public start(): void {
        if (this._started) {
            throw new Error(`dispatcher already started at port: ${this._port}`);
        }
        else {
            this._started = true;
            if (this._httpsCertPath) {
                const baseDir = path.isAbsolute(this._httpsCertPath) ? this._httpsCertPath : path.join(process.cwd(), this._httpsCertPath);
                https.createServer({
                    key: fs.readFileSync(path.join(baseDir, "privkey.pem"), "utf8"),
                    cert: fs.readFileSync(path.join(baseDir, "cert.pem"), "utf8"),
                    ca: fs.readFileSync(path.join(baseDir, "chain.pem"), "utf8")
                }, this._app.callback()).listen(this._port);
            } else {
                http.createServer(this._app.callback()).listen(this._port);
            }
            conditionInspect(this._colc, 2000); // check task pre-condition every 2s
            timeoutInspect(this._colc, 2300); // check task timeout every 2.3s
        }
    }

    private _koaInit(): Koa {
        const app = new Koa();
        app.use(async (ctx, next) => {
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
        app.use(async (ctx: Context<any>, next) => {
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
        app.use(async (ctx, next) => {
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
        return app;
    }
}
