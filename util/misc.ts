import { commify } from '@ethersproject/units';
import { showToast } from './notify';
import { ONE_DAY_MS } from '@app/config/constants';

export const capitalize = (v: string) => v[0].toUpperCase() + v.substring(1, v.length).toLowerCase();

export const removeScientificFormat = (x: number) => {
    if (!x) { return x }
    let v: any = x;
    if (Math.abs(v) < 1.0) {
        var e = parseInt(v.toString().split('e-')[1]);
        if (e) {
            v *= Math.pow(10, e - 1);
            v = '0.' + (new Array(e)).join('0') + v.toString().substring(2);
        }
    } else {
        var e = parseInt(v.toString().split('+')[1]);
        if (e > 20) {
            e -= 20;
            v /= Math.pow(10, e);
            v += (new Array(e + 1)).join('0');
        }
    }
    return v;
}

export const roundFloorString = (v: number, precision = 8) => {
    return toFixed(v, precision);
}

export function toFixed(num: number, fixed = 2) {
    try {
        var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return (removeScientificFormat(num).toString() || '0').match(re)[0];
    } catch (e) {
        console.log(e);
    }
    return num.toFixed(fixed)
}

export function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target: any, ...sources): any {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

export async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
export function split(arr, n) {
    var res = [];
    while (arr.length) {
        res.push(arr.splice(0, n));
    }
    return res;
}
export const delayMS = (t = 200) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(t);
        }, t);
    });
};
export const throttledPromises = (
    asyncFunction,
    items = [],
    batchSize = 1,
    delay = 0,
    promiseMethod = 'all',
) => {
    const clonedItems = [...items];
    return new Promise(async (resolve, reject) => {
        const output = [];
        const batches = split(clonedItems, batchSize);
        await asyncForEach(batches, async (batch) => {
            const promises = batch.map(asyncFunction).map(p => p.catch(reject));
            const results = await Promise[promiseMethod](promises);
            output.push(...results);
            await delayMS(delay);
        });
        resolve(output);
    });
};

export function uniqueBy(a, cond) {
    return a.filter((e, i) => a.findIndex(e2 => cond(e, e2)) === i);
}

export const exportToCsv = (data, filename = 'export.csv') => {
    try {
        const content = arrayToCsv(data);
        downloadBlob(content, filename, 'text/csv;charset=utf-8;');
    } catch (e) {
        console.log(e)
    }
}

export function arrayToCsv(data) {
    let rows: any[] = [];
    if (data.length > 0) {
        if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
            rows.push(Object.keys(data[0]));
            rows = rows.concat(
                data.map(d => {
                    return Object.values(d);
                })
            )
        }
    }
    return rows.map(row =>
        row
            .map(String)  // convert every value to String
            .map(v => v.replaceAll('"', '""'))  // escape double colons
            .map(v => `"${v}"`)  // quote it
            .join(',')  // comma-separated
    ).join('\r\n');  // rows starting on new lines
}

export function downloadBlob(content, filename, contentType) {
    // Create a blob
    var blob = new Blob([content], { type: contentType });
    var url = URL.createObjectURL(blob);

    // Create a link to download it
    var pom = document.createElement('a');
    pom.href = url;
    pom.setAttribute('download', filename);
    pom.click();
}

export const timestampToUTC = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${(date.getUTCDate()).toString().padStart(2, '0')}`
}

export const utcDateToDDMMYYYY = (d: string) => {
    const dateSplit = d.substring(0, 10).split('-');
    return `${dateSplit[2]}-${dateSplit[1]}-${dateSplit[0]}`;
}

// yyyy-mm-dd format
export const getTimestampFromUTCDate = (utcDate: string) => {
    const dateParts = utcDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Months are zero-based (0-11)
    const day = parseInt(dateParts[2]);

    const dateObj = new Date(Date.UTC(year, month, day));
    const timestamp = dateObj.getTime();

    return timestamp;
}

export const getMonthDiff = (d1: Date, d2: Date) => {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

export const getRandomFromStringList = (commaSeparatedList: string) => {
    const keys = commaSeparatedList.replace(/\s+/g, '').split(',');
    return keys[Math.floor(Math.random() * keys.length)];
}

export const handleApiResponse = (promiseResult: any) => {
    if (promiseResult?.status && promiseResult?.message) {
        const statusType = ["success", "warning", "info", "error"].includes(promiseResult?.status) ? promiseResult?.status : 'info';
        showToast({ status: statusType, description: promiseResult?.message });
    }
}

export const _getProp = (object: Object, key: string) => {
    if (!object) { return undefined }
    const lcKey = key.toLowerCase();
    const found = Object.entries(object).find(([key, value]) => {
        return key.toLowerCase() === lcKey
    });
    return found?.[1];
}

export const preciseCommify = (v: number, precision = 2, isDollar = false) => {
    if (precision === 0 || !v) {
        return `${isDollar ? '$' : ''}${commify((v || 0).toFixed(0))}`;
    }
    const fixed = v?.toFixed(precision);
    const split = fixed?.split('.');
    let result
    try {
        result = `${isDollar ? '$' : ''}${commify(split[0])}.${split[1]}`.replace('$-', '-$');
    } catch (e) {
        console.log(e)
    }
    return result || '';
}

// array needs to be already sorted
export const fillMissingDailyDatesWithMostRecentData = (arr: any[], minDayInterval: number) => {
    const filledArray = [];
    for (let i = 0; i < arr.length; i++) {
        const currentEntry = arr[i];
        const currentDateTs = getTimestampFromUTCDate(currentEntry.utcDate);

        // Add the current entry to the filledArray
        filledArray.push(currentEntry);

        if (i !== arr.length - 1) {
            const nextEntry = arr[i + 1];
            const nextDateTs = getTimestampFromUTCDate(nextEntry.utcDate);
            const diffTime = Math.abs(nextDateTs - currentDateTs);
            const intervalDays = minDayInterval * ONE_DAY_MS;
            const diffDays = Math.ceil(diffTime / intervalDays);

            if (diffDays > minDayInterval) {
                for (let j = 1; j < diffDays; j += minDayInterval) {
                    const ts = currentDateTs + j * intervalDays;
                    const missingEntry = {
                        ...currentEntry,
                        timestamp: ts,
                        x: ts,
                        utcDate: timestampToUTC(ts),
                        eventPointLabel: undefined,
                    };
                    filledArray.push(missingEntry);
                }
            }
        }
    }

    return filledArray;
}

export const ascendingEventsSorter = (a, b) => {
    if (a.blockNumber !== b.blockNumber) {
        return a.blockNumber - b.blockNumber; // Sort by blockNumber in ascending order
    } else {
        return a.logIndex - b.logIndex; // If block numbers are equal, sort by logIndex in ascending order
    }
}