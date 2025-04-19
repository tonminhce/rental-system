import * as dayjs from 'dayjs';

class MomentUtil {
  now(): string {
    return dayjs().format('YYYY-MM-DD HH:mm:ss');
  }

  format(date: Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjs(date).format(format);
  }
}

export const momentUtil = new MomentUtil(); 