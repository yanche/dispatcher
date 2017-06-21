
import * as def from "./def";
import * as create from "./create";
import * as get from "./get";
import report from "./report";
import upgrade from "./upgrade";
import close from "./close";
import dispatch from "./dispatch";

export type Handler = def.Handler;

const handlerMap: { [key: string]: def.Handler } = {};
handlerMap["CREATEMUL"] = create.createMul;
handlerMap["CREATEONE"] = create.createOne;
handlerMap["GETMUL"] = get.getMul;
handlerMap["GETONE"] = get.getOne;
handlerMap["REPORT"] = report;
handlerMap["UPGRADE"] = upgrade;
handlerMap["DISPATCH"] = dispatch;
handlerMap["CLOSE"] = close;

// return undefined if not found
export function findHandler(verb: string): def.Handler {
    return handlerMap[(verb || "").toUpperCase()];
}
