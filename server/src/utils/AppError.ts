export interface AppErrorOptions {
  isOperational?: boolean;
  details?: any;
  cause?: Error;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;
  public readonly cause?: Error;

  constructor(
    message: string,
    statusCode: number,
    options: AppErrorOptions = {}
  ) {
    super(message, { cause: options.cause });

    // Đảm bảo kế thừa đúng prototype chain trong TypeScript
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? true; // Đánh dấu lỗi thuộc về hệ thống hoặc lập trình
    this.details = options.details;
    this.cause = options.cause;

    // Chỉ capture stack trace khi không có error gốc
    if (!options.cause && Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
