
import * as Koa from "koa";
import * as handlers from "./handlers";
import * as def from "./def";
import * as db from "./db";
import * as utility from "../utility";
import * as http from "http";

class Dispatcher {
    private _port: number;
    private _started: boolean;
    private _koa: Koa;
    private _colc: utility.mongo.CollClient<def.Task>;
    private _mongoConnStr: string;

    constructor(port: number, mongoConnStr: string) {
        this._port = port;
        this._started = false;
        this._koa = this._koaInit();
        this._colc = db.createMongoCollClient(this._mongoConnStr = mongoConnStr);
    }

    listen(): void {
        if (this._started) {
            throw new Error(`dispatcher already started at port: ${this._port}`);
        }
        else {
            this._started;
            this._koa.listen(this._port);
        }
    }

    private _koaInit(): Koa {
        const koa = new Koa();
        koa.use(async (ctx: def.Context<any>, next) => {
            // parse http body
            if (ctx.is("json")) {
                try {
                    ctx.request.body = await getHttpJsonBody(ctx.req);
                    await next();
                }
                catch (err) {
                    ctx.status = 400;
                    ctx.message = (<Error>err).message;
                }
            }
            else {
                ctx.status = 400;
                ctx.message = `content type is not acceptable: ${ctx.header["content-type"]}`;
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
                await next();
            }
        });
        return koa;
    }
}

function getHttpJsonBody(req: http.IncomingMessage): Promise<Object> {
    return new Promise<Object>((res, rej) => {
        const bufs: Buffer[] = [];
        req.on("data", (chunk: Buffer) => {
            bufs.push(chunk);
        }).on("end", () => {
            try {
                res(JSON.parse(Buffer.concat(bufs).toString("utf-8")));
            }
            catch (err) {
                rej(new Error("http request body is not a valid json"));
            }
        }).on("error", err => {
            console.error(err.stack);
            rej(new Error("interal server error when reading http request data"));
        });
    });
}
