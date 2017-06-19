
import * as mongodb from 'mongodb';
import Hub from 'prmhub';
import * as validate from './validate';

export class CollClient<T> {
    private _colhub: Hub<mongodb.Collection>;
    private _deffields: Object;

    getOne(filter: Object, fields?: Object): Promise<T> {
        return this._colhub.get()
            .then(col => new Promise<T>((res, rej) => {
                col.findOne(filter, { fields: fields || this._deffields }, (err: Error, doc: T) => {
                    if (err != null) rej(err);
                    else res(doc);
                })
            }));
    }
    getAll(filter: Object, fields?: Object, orderby?: Object): Promise<Array<T>> {
        return this._colhub.get()
            .then(col => new Promise<Array<T>>((res, rej) => {
                let cursor = col.find(filter, fields || this._deffields);
                if (orderby != null) cursor = cursor.sort(orderby);
                cursor.toArray((err: Error, docs: Array<T>) => {
                    if (err != null) rej(err);
                    else res(docs);
                })
            }));
    }
    getMul(filter: Object, fields: Object, orderby: Object, skip: number, take: number): Promise<Array<T>> {
        return this._colhub.get()
            .then(col => new Promise<Array<T>>((res, rej) => {
                let cursor = col.find(filter, fields || this._deffields);
                if (orderby != null) cursor = cursor.sort(orderby);
                cursor.limit(take + skip).skip(skip).limit(take).toArray((err: Error, docs: Array<T>) => {
                    if (err != null) rej(err);
                    else res(docs);
                })
            }));
    }
    createOne(doc: Object): Promise<mongodb.ObjectID> {
        return this._colhub.get()
            .then(col => new Promise<mongodb.ObjectID>((res, rej) => {
                col.insertOne(doc, (err: Error, ret: mongodb.InsertOneWriteOpResult) => {
                    if (err != null) rej(err);
                    else res(ret.insertedId);
                });
            }));
    }
    updateAll(filter: Object, update: Object, upsert: boolean): Promise<{ updated: number, insertedId: mongodb.ObjectID }> {
        return this._colhub.get()
            .then(col => new Promise<{ updated: number, insertedId: mongodb.ObjectID }>((res, rej) => {
                col.updateMany(filter, update, { upsert: upsert }, (err: Error, ret: mongodb.UpdateWriteOpResult) => {
                    if (err != null) rej(err);
                    else res({ updated: ret.modifiedCount, insertedId: ret.upsertedId && ret.upsertedId._id });
                });
            }));
    }
    count(filter: Object): Promise<number> {
        return this._colhub.get()
            .then(col => new Promise<number>((res, rej) => {
                col.count(filter, (err: Error, ct: number) => {
                    if (err != null) rej(err);
                    else res(ct);
                });
            }))
    }
    findAndModify(filter: Object, update: Object, fields: Object, returnnew: boolean, upsert: boolean, sort?: Object): Promise<T> {
        return this._colhub.get()
            .then(col => new Promise<T>((res, rej) => {
                col.findOneAndUpdate(filter, update, {
                    sort: sort,
                    returnOriginal: !returnnew,
                    upsert: upsert,
                    projection: fields || this._deffields
                }, (err: Error, ret: mongodb.FindAndModifyWriteOpResultObject) => {
                    if (err != null) rej(err);
                    else res(ret.value);
                });
            }));
    }
    bulkUpdate(arr: Array<{ filter: Object, update: Object }>, upsert: boolean): Promise<void> {
        return this._colhub.get()
            .then(col => new Promise<void>((res, rej) => {
                const bulk = col.initializeUnorderedBulkOp();
                for (const item of arr) {
                    if (upsert) bulk.find(item.filter).upsert().update(item.update);
                    else bulk.find(item.filter).update(item.update);
                }
                bulk.execute((err: Error, ret: mongodb.BulkWriteResult) => {
                    if (err != null) rej(err);
                    else res();
                });
            }))
    }
    bulkInsert(arr: Array<Object>): Promise<Array<mongodb.ObjectID>> {
        return this._colhub.get()
            .then(col => new Promise<Array<mongodb.ObjectID>>((res, rej) => {
                const bulk = col.initializeUnorderedBulkOp();
                for (const item of arr) bulk.insert(item);
                bulk.execute((err: Error, ret: mongodb.BulkWriteResult) => {
                    if (err != null) rej(err);
                    else res((<Array<{ _id: mongodb.ObjectID }>>ret.getInsertedIds()).map(x => x._id));
                })
            }));
    }
    constructor(dbhub: Hub<mongodb.Db>, collname: string, deffields: Object) {
        this._colhub = new Hub<mongodb.Collection>(() => dbhub.get().then(db => db.collection(collname)));
        this._deffields = deffields;
    }
}

export class DbClient {
    private _connstr: string;
    private _dbhub: Hub<mongodb.Db>;

    getCollClient<T>(collname: string, deffields: Object): CollClient<T> {
        return new CollClient<T>(this._dbhub, collname, deffields);
    }

    constructor(connstr: string) {
        this._connstr = connstr;
        this._dbhub = new Hub<mongodb.Db>(() => {
            return new Promise<mongodb.Db>((res, rej) => {
                mongodb.MongoClient.connect(connstr, (err: Error, db: mongodb.Db) => {
                    if (err != null) rej(err);
                    else res(db);
                })
            });
        })
    }
}

export function newId(): mongodb.ObjectID {
    return new mongodb.ObjectID();
}

export function objIdfy(obj: any): any {
    if (obj == null || obj instanceof mongodb.ObjectID)
        return obj;
    else if (Array.isArray(obj)) {
        return obj.map(objIdfy);
    }
    else if (validate.isObj(obj)) {
        const ret: { [name: string]: any } = {};
        for (let i in obj) {
            ret[i] = objIdfy((<any>obj)[i]);
        }
        return ret;
    }
    else if (objIdLike(obj)) {
        return convObjId(obj);
    }
    else
        return obj; //number, boolean
}

const charCode0 = '0'.charCodeAt(0);
const charCode9 = '9'.charCodeAt(0);
const charCodeAL = 'a'.charCodeAt(0);
const charCodeFL = 'f'.charCodeAt(0);
const charCodeAU = 'A'.charCodeAt(0);
const charCodeFU = 'F'.charCodeAt(0);
function objIdLike(str: any): boolean {
    if (str instanceof mongodb.ObjectID)
        return true;
    if (validate.isStr(str) && str.length == 24) {
        const sstr = <string>str; //for type check only
        for (let i = 0; i < 24; ++i) {
            const cc = sstr.charCodeAt(i);
            if (!((cc >= charCode0 && cc <= charCode9) || (cc >= charCodeAL && cc <= charCodeFL) || (cc >= charCodeAU && cc <= charCodeFU)))
                return false;
        }
        return true;
    }
    else
        return false;
};

export function convObjId(id: any): mongodb.ObjectID {
    if (id == null)
        return null;
    else {
        try {
            return new mongodb.ObjectID(id);
        }
        catch (err) {
            return null;
        }
    }
};
