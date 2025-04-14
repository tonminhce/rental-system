import { momentUtil } from './moment.util';
export default class ResponseUtil {
  private readonly appName = process.env['APP_NAME'] || 'app_name';

  success(data: object, statusCode: number = 200): object {
    return {
      service: this.appName,
      statusText: 'success',
      statusCode: statusCode,
      data: data,
      timestamp: momentUtil.now(),
    };
  }

  error(statusCode: number, message: string, detail: any): object {
    return {
      service: this.appName,
      statusText: 'fail',
      statusCode: statusCode,
      message: message,
      detail: detail,
      timestamp: momentUtil.now(),
    };
  }

  successWithMessage(
    data: object,
    statusCode: number = 200,
    message: string | null = null,
  ): object {
    const response = {
      service: this.appName,
      statusText: 'success',
      statusCode: statusCode,
      data: data,
      timestamp: momentUtil.now(),
    };
    if (message) response['message'] = message
    return response;
  }
}
export const responseUtil = new ResponseUtil();
