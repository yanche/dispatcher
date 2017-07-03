
import * as validate from "./validate";
import * as mongo from "./mongo";
import * as date from "./date";
import * as array from "./array";
import * as stream from "./stream";

export function whileLoop(condition: () => Promise<boolean>, body: () => Promise<any>): Promise<void> {
    return condition()
        .then(loop => {
            if (loop) return body().then(() => whileLoop(condition, body));
            else return;
        });
}

export { validate, mongo, date, array, stream };
