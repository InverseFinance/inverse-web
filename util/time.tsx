import moment from 'moment'

export const timeSince = (time: Date | undefined) => {
  if (!time) {
    return ''
  }

  const minutes = Math.abs(moment().diff(moment(time), 'minutes'))
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  }
  if (minutes < 60 * 24) {
    const hours = Math.floor(minutes / 60)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }

  if (minutes < 60 * 24 * 7) {
    const days = Math.floor(minutes / 60 / 24)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  return moment(time).format('MMM D, YYYY')
}

export const timeUntil = (time: Date | undefined) => {
  if (!time) {
    return ''
  }

  const minutes = Math.abs(moment(time).diff(moment(), 'minutes'))
  if (minutes < 60) {
    return `in ${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  if (minutes < 60 * 24) {
    const hours = Math.floor(minutes / 60)
    return `in ${hours} hour${hours !== 1 ? 's' : ''}`
  }

  if (minutes < 60 * 24 * 7) {
    const days = Math.floor(minutes / 60 / 24)
    return `in ${days} day${days !== 1 ? 's' : ''}`
  }

  return moment(time).format('MMM D, YYYY')
}
