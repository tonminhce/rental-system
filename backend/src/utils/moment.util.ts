/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as weekOfYear from 'dayjs/plugin/weekOfYear';
import * as isBetween from 'dayjs/plugin/isBetween';
import * as updateLocale from 'dayjs/plugin/updateLocale';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import * as isoWeeksInYear from 'dayjs/plugin/isoWeeksInYear';
import * as isLeapYear from 'dayjs/plugin/isLeapYear';
import {
  dateTimeFormat,
} from './constant.util';

dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(updateLocale);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeeksInYear);
dayjs.extend(isLeapYear);

dayjs.updateLocale(dayjs().locale(), {
  weekStart: 0,
})

export class Moment {
  private timezone = 'Asia/Ho_Chi_Minh';

  public isValid(date: string, format: string) {
    return dayjs(date, format, true).isValid();
  }

  public now() {
    return dayjs().tz(this.timezone).format(dateTimeFormat);
  }
  public nowObj() {
    return dayjs();
  }
  public formatDay(date) {
    return dayjs(date).tz(this.timezone).format(dateTimeFormat);
  }
  public current() {
    return dayjs().tz(this.timezone);
  }
  public parseDate(dateString: string): dayjs.Dayjs {
    return dayjs.tz(dateString, this.timezone);
  }
}
export const momentUtil = new Moment();
