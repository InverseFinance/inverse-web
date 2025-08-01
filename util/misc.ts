import { commify } from '@ethersproject/units';
import { showToast } from './notify';
import { ONE_DAY_MS, SECONDS_PER_BLOCK, SIGN_MSG } from '@app/config/constants';
 ;

export const capitalize = (v: string) => v[0].toUpperCase() + v.substring(1, v.length).toLowerCase();
export const capitalizeFirstLetter = (v: string) => v[0].toUpperCase() + v.substring(1, v.length);

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
// yyyy-mm-dd format
export const utcDateStringToTimestamp = (dateString: string) => {
    // Validate the input format using a regular expression
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        throw new Error('Invalid date format. Please use "yyyy-mm-dd" format.');
    }
    // Parse the date string and convert it to a UTC date object
    const date = new Date(`${dateString}T00:00:00Z`);
    // Check for invalid dates (e.g., "2023-02-30")
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date.');
    }
    return date.getTime();
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

export const handleApiResponse = (promiseResult: any, onSuccess?: (o?: any) => void) => {
    if (promiseResult?.status && promiseResult?.message) {
        const statusType = ["success", "warning", "info", "error"].includes(promiseResult?.status) ? promiseResult?.status : 'info';
        showToast({ status: statusType, description: promiseResult?.message });
    } else if (typeof promiseResult?.status === 'number' && promiseResult?.status >= 400) {
        showToast({ status: 'warning', description: promiseResult?.statusText });
    }
    if (!!onSuccess && ["ok", "success", 200].includes(promiseResult?.status)) {
        onSuccess(promiseResult);
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

export const preciseCommify = (v: number, precision = 2, isDollar = false, isRemoveTrailingZeros = false) => {
    if (precision === 0 || !v) {
        return `${isDollar ? '$' : ''}${commify((v || 0).toFixed(0))}`;
    }
    const fixed = v?.toFixed(precision);
    const split = fixed?.split('.');
    let result
    try {
        result = `${isDollar ? '$' : ''}${commify(split[0])}.${split[1]}`.replace('$-', '-$');
        if (isRemoveTrailingZeros) {
            result = removeTrailingZeros(result);
        }
    } catch (e) {
        console.log(e)
    }
    return result || '';
}

// array needs to be already sorted
export const fillMissingDailyDatesWithMostRecentData = (arr: any[], minDayInterval: number, dateKey = 'utcDate', fillInValue?: number) => {
    const filledArray = [];
    for (let i = 0; i < arr.length; i++) {
        const currentEntry = arr[i];
        const currentDateTs = getTimestampFromUTCDate(currentEntry[dateKey]);

        // Add the current entry to the filledArray
        filledArray.push(currentEntry);

        if (i !== arr.length - 1) {
            const nextEntry = arr[i + 1];
            const nextDateTs = getTimestampFromUTCDate(nextEntry[dateKey]);
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
                        [dateKey]: timestampToUTC(ts),
                        eventPointLabel: undefined,
                        _isFilledIn: true,
                    };
                    if (fillInValue !== undefined) {
                        missingEntry.y = fillInValue;
                    }
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

export const lowercaseObjectKeys = (obj: any) => {
    return Object.keys(obj).reduce((accumulator, key) => {
        accumulator[key.toLowerCase()] = obj[key];
        return accumulator;
    }, {});
}
export const removeTrailingZeros = (num: string) => {
    return num.replace(/(\.\d*?[1-9])0+([a-zA-Z])?$/, '$1$2').replace(/\.0+([a-zA-Z])?$/, '$1')
}
// in case api failed to fetch a specific date, we use the closest previous date
export const getClosestPreviousHistoValue = (histoValues: { [key: string]: number }, date: string, defaultValue: number) => {
    const dates = Object.keys(histoValues);
    const closestDate = dates.reduce((prev, curr) => {
        return curr < date ? curr : prev;
    }, date);
    return histoValues[closestDate] || defaultValue;
}

export const getOrClosest = (data: { [key: string]: number }, targetDateStr: string, maxTries = 365) => {
    // If the date exists, return the value immediately
    if (data[targetDateStr] !== undefined) {
        return data[targetDateStr];
    }

    let date = new Date(targetDateStr);
    for (let i = 0; i < maxTries; i++) {
        const delta = i + 1;
        // Try the next date
        date.setDate(date.getDate() + delta);
        let nextDateStr = date.toISOString().split('T')[0];
        if (data[nextDateStr] !== undefined) {
            return data[nextDateStr];
        }

        // Try the previous date
        date.setDate(date.getDate() - 2 * delta);  // subtract 2 because we added 1 in the above step
        let prevDateStr = date.toISOString().split('T')[0];
        if (data[prevDateStr] !== undefined) {
            return data[prevDateStr];
        }

        // Reset to the next date for the next loop iteration
        date.setDate(date.getDate() + delta);
    }
    return undefined;
}

export const getEveryXthElement = (arr: any[], X = 1) => {
    let result = [];
    for (let i = X - 1; i < arr.length; i += X) {
        result.push(arr[i]);
    }
    return result;
}

// gross estimation
export const estimateBlockTimestamp = (pastBlock: number, nowTs: number, nowBlock: number) => {
    return nowTs - ((nowBlock - pastBlock) * SECONDS_PER_BLOCK * 1000);
}
export const estimateBlocksTimestamps = (pastBlocks: number[], nowTs: number, nowBlock: number) => {
    return pastBlocks.map(pastBlock => estimateBlockTimestamp(pastBlock, nowTs, nowBlock));
}

export const getWeek = function (ts: number) {
    const date = new Date(ts);
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
        - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Returns the four-digit year corresponding to the ISO week of the date.
export const getWeekYear = function (ts: number) {
    const date = new Date(ts);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    return date.getFullYear();
}

export function getPreviousThursdayUtcDateOfTimestamp(ts: number) {    
    return timestampToUTC(getPreviousThursdayTimestamp(ts));
}

export const getWeekIndexUtc = (ts?: number) => {
    const d = ts ? new Date(ts) : new Date();
    const weekFloat = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0) / (ONE_DAY_MS * 7);
    return Math.floor(weekFloat);
}

export function getPreviousThursdayTimestamp(ts?: number) {
    const date = ts ? new Date(ts) : new Date();
    const dateUTCts = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
    const dateUtc = new Date(dateUTCts);
    const dayOfWeek = dateUtc.getUTCDay();
    const daysSinceLastThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : 7 - (4-dayOfWeek);
    dateUtc.setUTCDate(dateUtc.getUTCDate() - daysSinceLastThursday);
    return +(dateUtc);
}

export function getLastThursdayTimestamp() {
    return getPreviousThursdayTimestamp();
}

export function getNextThursdayTimestamp() {
    return getLastThursdayTimestamp() + 7 * ONE_DAY_MS;
}

export const getAvgOnLastItems = (data: any[], attribute: string, nbLastItems: number) => {
    if (!data?.length) return 0;
    const start = Math.max(0, data.length - nbLastItems);
    const slice = data.slice(start, data.length);
    return slice.reduce((prev, curr) => prev + curr[attribute], 0) / slice.length;
}

const avgWithQualifier = function (array: number[], qualifier?: (val: number) => boolean) {
    let sum = 0, count = 0, val;
    for (var i in array) {
        val = array[i];
        if (!qualifier || qualifier(val)) {
            sum += val;
            count++;
        }
    }
    return sum / count;
};

export const getMovingAvg = (array: number[], count: number, qualifier?: (val: number) => boolean) => {
    const result = [];
    let val;

    // pad beginning of result with null values
    for (var i = 0; i < count - 1; i++)
        result.push(null);

    // calculate average for each subarray and add to result
    for (let i = 0, len = array.length - count; i <= len; i++) {
        val = avgWithQualifier(array.slice(i, i + count), qualifier);
        if (isNaN(val))
            result.push(null);
        else
            result.push(val);
    }

    return result;
}

export const getExponentialMovingAvg = (array: number[], count: number) => {
    var k = 2 / (count + 1);
    const emaArray = [null];
    const len = array.length;
    for (var i = 1; i < len; i++) {
        emaArray.push(array[i] * k + emaArray[i - 1] * (1 - k));
    }
    return emaArray;
}

export function formatDuration(seconds: number) {
    const days = Math.floor(seconds / (24 * 3600)); // Total days
    const hours = Math.floor((seconds % (24 * 3600)) / 3600); // Remaining hours
    const minutes = Math.floor((seconds % 3600) / 60); // Remaining minutes
    const secs = Math.floor(seconds % 60); // Remaining seconds

    return `${days > 0 ? String(days).padStart(2, '0') + 'd:' : ''}`
         + `${String(hours).padStart(2, '0')}h:`
         + `${String(minutes).padStart(2, '0')}m:`
         + `${String(secs).padStart(2, '0')}s`;
}

export const calculateMaxLeverage = (collateralFactor: number) => {
    return 1 / (1 - collateralFactor);
}

// make sure there is only one data point per x value
export const getSimplifiedData = (data: any[], sortableAttribute = 'x') => {
    const uniqueX = [...new Set(data.map(d => d[sortableAttribute]))];
    return uniqueX.map(v => {
        return data.findLast(d => d[sortableAttribute] <= v);
    });
}

function escapeHtml(str) {
    if(!str?.replace) return str;
    return str.replace(/[&<>"']/g, function (match) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escapeMap[match];
    });
}

export function formatJsonToHtml(json: Object)   {
    let htmlContent = "<ul>";

    function traverseJson(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let value = obj[key];
                let escapedKey = escapeHtml(key?.toString());
                if (typeof value === 'object' && value !== null) {
                    htmlContent += `<li><span style="font-weight: bold" class="key">${escapedKey}</span>:<ul style="padding-left: 1rem">`;
                    traverseJson(value);  // Recursively process nested objects
                    htmlContent += `</ul></li>`;
                } else {
                    const escapedValue = escapeHtml(value);
                    htmlContent += `<li><span style="font-weight: bold">${escapedKey}</span>: <span>${escapedValue}</span></li>`;
                }
            }
        }
    }

    traverseJson(json);
    htmlContent += "</ul>";

    return htmlContent;
}

export const getSignMessageWithUtcDate = () => {
    return `${SIGN_MSG}
    
Date: ${timestampToUTC(Date.now())}`;
}