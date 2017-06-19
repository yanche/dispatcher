
import * as moment from "moment";

export function datetimeFormat(date: Date | number, utc?: boolean): string {
    return format(date, 'YYYY/MM/DD HH:mm:ss', utc);
}

export function format(date: Date | number, format?: string, utc?: boolean): string {
    let d: Date = null;
    if (typeof date === 'number') d = new Date(date);
    else d = date;
    return (utc ? moment.utc(d) : moment(d)).format(format || 'YYYY/MM/DD');
}
