export interface IApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface IApiErrorResponse {
  success: false;
  message: string;
}

export type IApiResponse<T> = IApiSuccessResponse<T> | IApiErrorResponse;