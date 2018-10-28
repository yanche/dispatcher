
import * as mongodb from "mongodb";
import * as validate from "./validate";

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

const charCode0 = "0".charCodeAt(0);
const charCode9 = "9".charCodeAt(0);
const charCodeAL = "a".charCodeAt(0);
const charCodeFL = "f".charCodeAt(0);
const charCodeAU = "A".charCodeAt(0);
const charCodeFU = "F".charCodeAt(0);
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
