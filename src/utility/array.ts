
export function unique<T>(arr: Array<T>): Array<T> {
    const ret = new Array<T>();
    for (let r of arr) {
        if (ret.every(x => x !== r)) {
            ret.push(r);
        }
    }
    return ret;
}

export function flatten<T>(arr: Array<Array<T>>):Array<T> {
    return Array.prototype.concat.apply([], arr);
}
