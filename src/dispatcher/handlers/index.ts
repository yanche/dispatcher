
import * as def from "./def";
import * as create from "./create";
import * as get from "./get";
import { report } from "./report";
import * as manage from "./manage";
import { dispatch } from "./dispatch";

export type Handler = def.Handler;

const handlerMap: { [key: string]: def.Handler } = {};
handlerMap["CREATEMUL"] = create.createMul;
handlerMap["CREATEONE"] = create.createOne;
handlerMap["GETMUL"] = get.getMul;
handlerMap["GETONE"] = get.getOne;
handlerMap["REPORT"] = report;
handlerMap["DISPATCH"] = dispatch;
handlerMap["UPGRADE"] = manage.upgrade;
handlerMap["CLOSE"] = manage.close;
handlerMap["RENEW"] = manage.renew;
handlerMap["MAKEREADY"] = manage.makeready;

// return undefined if not found
export function findHandler(verb: string): def.Handler {
    return handlerMap[(verb || "").toUpperCase()];
}
