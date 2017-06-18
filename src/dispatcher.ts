
import * as Koa from "koa";
import * as handlers from "./handlers";

class Dispatcher {
    private _port: number;
    private _started: boolean;
    private _koa: Koa;

    constructor(port: number) {
        this._port = port;
        this._started = false;
        this._koa = this._koaInit();
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
        koa.use(async (ctx, next) => {
            const verb: string = ctx.header["verb"];
            const handler = handlers.findHandler(verb);
            if (!handler) {
                ctx.status = 404;
                ctx.message = `invalid verb: ${verb}`;
            }
            else {
                await handler(ctx);
                next();
            }
        });
        return koa;
    }
}
