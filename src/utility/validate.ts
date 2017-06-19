
export function isObj(input: any): input is object {
    return typeof input === "object";
}

export function isStr(input: any): input is string {
    return typeof input === "string";
}

export function isNum(input: any): input is number {
    return typeof input === 'number';
}

export function isInt(input: any): input is number {
    return isNum(input) && Math.ceil(input) === input;
}

export function pos(input: any, int?: boolean): input is number {
    return isNum(input) && input > 0 && (!int || Math.ceil(input) === input);
}
