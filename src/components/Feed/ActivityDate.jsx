import {
  format,
  formatDistanceToNow,
  isValid,
  isToday,
  isSameYear,
  isSameDay,
  isSameWeek,
  isSameMinute,
} from 'date-fns'
import Typography from '@/theme/typography.module.css'
import { classNames } from 'primereact/utils'
import styled from 'styled-components'

const DateStyled = styled.span`
  margin-left: auto;
  color: var(--md-sys-color-outline);
  user-select: none;
  white-space: nowrap;
  display: flex;
  align-items: center;
`

export const getFuzzyDate = (date) => {
  let fuzzyDate = formatDistanceToNow(new Date(date), { addSuffix: true })

  // remove 'about' from the string
  fuzzyDate = fuzzyDate.replace('about', '')
  // replace minutes with min
  fuzzyDate = fuzzyDate.replace('minutes', 'mins')
  fuzzyDate = fuzzyDate.replace('minute', 'min')
  // remove the word ' ago'
  fuzzyDate = fuzzyDate.replace(' ago', '')

  // if date is less than a minute ago, return 'Just now'
  if (isSameMinute(new Date(date), new Date())) fuzzyDate = 'Just now'

  return fuzzyDate
}

const ActivityDate = ({ date, isExact, ...props }) => {
  const dateObj = new Date(date)
  if (!isValid(dateObj)) return null

  // is date over a day old?
  const today = isToday(dateObj)
  const sameYear = isSameYear(dateObj, new Date())
  const yesterday = isSameDay(dateObj, new Date(new Date().setDate(new Date().getDate() - 1)))
  const sameWeek = isSameWeek(dateObj, new Date())
  const sameMin = isSameMinute(dateObj, new Date())

  const dateFormat = yesterday ? '' : sameYear ? (sameWeek ? 'E' : 'MMM d') : 'MMM d yyyy'
  const timeFormat = 'h:mm a'

  let dateString =
    today && !isExact ? getFuzzyDate(dateObj) : format(dateObj, `${dateFormat}, ${timeFormat}`)

  if (yesterday) dateString = `Yesterday${dateString}`

  // if less than a minute ago overwrite the date string
  if (sameMin) dateString = 'Just now'

  return (
    <DateStyled className={classNames(Typography.bodySmall, 'date')} {...props}>
      {dateString}
    </DateStyled>
  )
}

export default ActivityDate
