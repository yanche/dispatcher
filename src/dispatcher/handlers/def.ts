
import * as Koa from "koa";
import * as utility from "../../utility";
import { Task } from "../def";

export interface Handler {
    (ctx: Koa.Context, next: () => any, colc: utility.mongo.CollClient<Task>): Promise<void>;
}

export abstract class DataModel {
    protected _valid: boolean;

    public get valid(): boolean {
        return this._valid;
    }
}
