export class SuccessResponse<T = unknown> {
  readonly success = true;
  data: T;

  constructor(data: T) {
    this.data = data;
  }
}

export interface ErrorPayload {
  name?: string;
  message: string;
}

export class ErrorResponse {
  readonly success = false;
  error: ErrorPayload;

  constructor(message: string, name?: string) {
    this.error = { message, name };
  }
}
