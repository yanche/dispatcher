
import * as def from "./def";
import * as create from "./create";
import get from "./get";
import dispatch from "./dispatch";

export type Handler = def.Handler;

const handlerMap: { [key: string]: def.Handler } = {};
handlerMap["CREATEMUL"] = create.createMul;
handlerMap["CREATEONE"] = create.createOne;
handlerMap["GETMUL"] = get;
handlerMap["DISPATCH"] = dispatch;

// return undefined if not found
export function findHandler(verb: string): def.Handler {
    return handlerMap[(verb || "").toUpperCase()];
}
