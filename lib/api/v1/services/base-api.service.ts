/**
 * Base API Service
 * Provides consistent JSend response formatting following Batu patterns
 */

export interface JSendSuccessResponse<T = any> {
  status: 'success';
  data: T;
  message?: string;
}

export interface JSendFailResponse {
  status: 'fail';
  data: Record<string, string>;
}

export interface JSendErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  data?: any;
}

export type JSendResponse<T = any> = JSendSuccessResponse<T> | JSendFailResponse | JSendErrorResponse;

export class BaseApiService {
  /**
   * Create a success response
   */
  successResponse<T>(data: T, message?: string): JSendSuccessResponse<T> {
    return {
      status: 'success',
      data,
      ...(message && { message }),
    };
  }

  /**
   * Create a fail response (client error)
   */
  failResponse(data: Record<string, string>): JSendFailResponse {
    return {
      status: 'fail',
      data,
    };
  }

  /**
   * Create an error response (server error)
   */
  errorResponse(message: string, code?: string, data?: any): JSendErrorResponse {
    return {
      status: 'error',
      message,
      ...(code && { code }),
      ...(data && { data }),
    };
  }
}
