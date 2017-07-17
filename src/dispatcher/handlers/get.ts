
import { Context } from "../def";
import { Task } from "../../def";
import * as utility from "../../utility";

export async function getOne(ctx: Context<{ filter: Object; fields?: Object }>, next: () => any, colc: utility.mongo.CollClient<Task>) {
    const body = ctx.request.body || { filter: {}, fields: null };
    if (!utility.validate.isObj(body)) {
        ctx.status = 400;
        ctx.message = "http request body must be an object";
    }
    else {
        const filter = body.filter || {};
        const fields = body.fields || null;
        if (!utility.validate.isObj(filter) || (!utility.validate.isObj(fields) && fields !== null)) {
            ctx.status = 400;
            ctx.message = "http request body has bad format, must be {filter:, fields:}";
        }
        else {
            const task = await colc.getOne(utility.mongo.objIdfy(filter), fields);
            if (task) {
                ctx.body = task;
                await next();
            }
            else {
                ctx.status = 404;
            }
        }
    }
}

export async function getMul(ctx: Context<{ filter: Object; fields?: Object, orderby?: Object, page: number, pageSize: number }>, next: () => any, colc: utility.mongo.CollClient<Task>) {
    const body = ctx.request.body || { filter: {}, fields: null, orderby: null, page: 1, pageSize: 15 };
    if (!utility.validate.isObj(body)) {
        ctx.status = 400;
        ctx.message = "http request body must be an object";
    }
    else {
        const filter = body.filter || {};
        const fields = body.fields || null;
        const page = body.page || 1;
        const pageSize = body.pageSize || 15;
        const orderby = body.orderby || null;
        if (!utility.validate.isObj(filter) || (!utility.validate.isObj(fields) && fields !== null) || (!utility.validate.isObj(orderby) && orderby !== null)
            || !utility.validate.pos(page, true) || !utility.validate.pos(pageSize, true) || pageSize > 30) {
            ctx.status = 400;
            ctx.message = pageSize > 30 ? "maximum pagesize is 30" : "http request body has bad format, must be {filter:, fields:}";
        }
        else {
            const _flt = utility.mongo.objIdfy(filter);
            const data = await Promise.all([
                colc.getMul(_flt, fields, orderby, (page - 1) * pageSize, pageSize),
                colc.count(_flt)
            ]);
            ctx.body = {
                list: data[0],
                total: data[1],
                page: page,
                pageSize: pageSize
            };
            await next();
        }
    }
}
