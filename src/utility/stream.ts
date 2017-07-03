
import * as stream from "stream";

export function getData(stm: stream.Readable): Promise<Buffer> {
    return new Promise<Buffer>((res, rej) => {
        const bufs: Buffer[] = [];
        stm.on("data", (chunk: Buffer) => {
            bufs.push(chunk);
        }).on("end", () => {
            res(Buffer.concat(bufs));
        }).on("error", err => {
            rej(err);
        });
    });
}
