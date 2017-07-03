
import * as moment from "moment";

export function datetimeFormat(date: Date | number, utc?: boolean): string {
    return format(date, "YYYY/MM/DD HH:mm:ss", utc);
}

export function format(date: Date | number, format?: string, utc?: boolean): string {
    let d: Date = null;
    if (typeof date === "number") d = new Date(date);
    else d = date;
    return (utc ? moment.utc(d) : moment(d)).format(format || "YYYY/MM/DD");
}

export function dateOffset(date: Date | number, options: { year?: number, month?: number, day?: number, hour?: number, minute?: number, second?: number, ms?: number }): Date {
    const ret = typeof date === 'number' ? new Date(date) : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds()));
    if ("year" in options) ret.setUTCFullYear(ret.getUTCFullYear() + options.year);
    if ("month" in options) ret.setUTCMonth(ret.getUTCMonth() + options.month);
    if ("day" in options) ret.setUTCDate(ret.getUTCDate() + options.day);
    if ("hour" in options) ret.setUTCHours(ret.getUTCHours() + options.hour);
    if ("minute" in options) ret.setUTCMinutes(ret.getUTCMinutes() + options.minute);
    if ("second" in options) ret.setUTCSeconds(ret.getUTCSeconds() + options.second);
    if ("ms" in options) ret.setUTCMilliseconds(ret.getUTCMilliseconds() + options.ms);
    return ret;
}
