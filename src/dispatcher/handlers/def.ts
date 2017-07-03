
import * as Koa from "koa";
import * as utility from "../../utility";
import { Task } from "../../def";

export interface Handler {
    (ctx: Koa.Context, next: () => any, colc: utility.mongo.CollClient<Task>): Promise<void>;
}

export abstract class DataModel {
    protected _valid: boolean;

    public get valid(): boolean {
        return this._valid;
    }
}
export abstract class CreateDataModel<T> extends DataModel {
    protected _mongodoc: T;

    public get mongoDoc(): T {
        return this._mongodoc;
    }
}
