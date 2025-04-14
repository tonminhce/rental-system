import { createLogger, format, transports } from 'winston';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: () =>
        dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss'),
    }),
    format.printf((info) => {
      return JSON.stringify(info);
    }),
  ),

  transports: [new transports.Console()],
});

export default logger;
