
export function isObj(input: any): input is object {
    return typeof input === "object";
}

export function isStr(input: any): input is string {
    return typeof input === "string";
}
