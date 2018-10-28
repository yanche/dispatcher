
import * as Koa from "koa";
import { CollClient } from "@belongs/mongoutil";
import { Task } from "../../def";

export interface Handler {
    (ctx: Koa.Context, next: () => any, colc: CollClient<Task>): Promise<void>;
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
