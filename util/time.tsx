const getMinutesBetweenDates = (date1: Date, date2: Date): number => {
  return Math.abs(Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60)))
}

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

const getDateSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
export const formatDay = (date: Date | number): string => {
  const _date = typeof date === 'number' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[_date.getMonth()]} ${_date.getDate()}${getDateSuffix(_date.getDate())}`
}

export const formatDate = (date: Date | number): string => {
  const _date = typeof date === 'number' ? new Date(date) : date;
  if(_date.toString() === 'Invalid Date') {
    return _date.toString();
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[_date.getMonth()]} ${_date.getDate()}${getDateSuffix(_date.getDate())}, ${_date.getFullYear()}`
}

export const formatDateWithTime = (date: Date | number): string => {
  const _date = typeof date === 'number' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = _date.getDate();
  const hours = _date.getHours();
  const minutes = _date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const formattedHours = hours % 12 || 12; // Convert 24h to 12h format
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${months[_date.getMonth()]} ${day}${getOrdinalSuffix(day)} ${_date.getFullYear()}, ${formattedHours}:${formattedMinutes} ${ampm}`;
}

export const fromNow = (date: Date | number, withoutSuffixOrPrefix = false): string => {
  if(isBefore(date)) {
    return timeSince(date, withoutSuffixOrPrefix);
  }
  return timeUntil(date, withoutSuffixOrPrefix);
}

export const timeSince = (time: Date | number | undefined, withoutSuffix = false) => {
  if (!time) {
    return ''
  }
  const _time = typeof time === 'number' ? new Date(time) : time;

  const minutes = getMinutesBetweenDates(new Date(), _time)
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}${withoutSuffix ? '' : ' ago'}`
  }
  if (minutes < 60 * 24) {
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours !== 1 ? 's' : ''}${withoutSuffix ? '' : ' ago'}`
  }

  if (minutes < 60 * 24 * 7) {
    const days = Math.floor(minutes / 60 / 24)
    return `${days} day${days !== 1 ? 's' : ''}${withoutSuffix ? '' : ' ago'}`
  }

  if (minutes < 60 * 24 * 30) {
    const weeks = Math.floor(minutes / (60 * 24 * 7))
    return `${weeks} week${weeks !== 1 ? 's' : ''}${withoutSuffix ? '' : ' ago'}`
  }

  if (minutes < 60 * 24 * 365) {
    const months = Math.floor(minutes / (60 * 24 * 30))
    return `${months} month${months !== 1 ? 's' : ''}${withoutSuffix ? '' : ' ago'}`
  }

  const years = Math.floor(minutes / (60 * 24 * 365));
  return `${years} year${years !== 1 ? 's' : ''}${withoutSuffix ? '' : ' ago'}`;
}

export const timeUntil = (time: Date | number | undefined, withoutPrefix = false) => {
  if (!time) {
    return ''
  }

  const _time = typeof time === 'number' ? new Date(time) : time;
  if(_time.toString() === 'Invalid Date') {
    return 'Distant Future';
  }

  const minutes = getMinutesBetweenDates(_time, new Date())
  if (minutes < 60) {
    return `${withoutPrefix ? '' : 'in '}${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  if (minutes < 60 * 24) {
    const hours = Math.floor(minutes / 60)
    return `${withoutPrefix ? '' : 'in '}${hours} hour${hours !== 1 ? 's' : ''}`
  }

  if (minutes < 60 * 24 * 7) {
    const days = Math.floor(minutes / 60 / 24)
    return `${withoutPrefix ? '' : 'in '}${days} day${days !== 1 ? 's' : ''}`
  }

  if (minutes < 60 * 24 * 30) {
    const weeks = Math.floor(minutes / (60 * 24 * 7))
    return `${withoutPrefix ? '' : 'in '}${weeks} week${weeks !== 1 ? 's' : ''}`
  }

  if (minutes < 60 * 24 * 365) {
    const months = Math.floor(minutes / (60 * 24 * 30))
    return `${withoutPrefix ? '' : 'in '}${months} month${months !== 1 ? 's' : ''}`
  }

  const years = Math.floor(minutes / (60 * 24 * 365));
  return `${withoutPrefix ? '' : 'in '}${years} year${years !== 1 ? 's' : ''}`
}

export const getUtcDateChartLabel = (date: Date | number, withYear = false) => {
  const _date = typeof date === 'number' ? new Date(date) : date;
  return _date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) + (withYear ? `-${_date.getFullYear().toString().slice(2, 4)}` : '');
}

export const isAfter = (date: Date | number, now: Date | number = new Date()) => {
  const _date = typeof date === 'number' ? new Date(date) : date;
  return new Date(_date).getTime() > new Date(now).getTime();
}

export const isBefore = (date: Date | number, now: Date | number = new Date()) => {
  const _date = typeof date === 'number' ? new Date(date) : date;
  return new Date(_date).getTime() < new Date(now).getTime();
}

export const getUTCEndOfDay = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
}