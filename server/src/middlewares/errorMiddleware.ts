import { Request, Response, NextFunction } from "express";
import { AppError } from "~/utils/AppError";
import logger from "~/utils/logger";
import HTTP_STATUS from "~/constants/httpStatus";
import { config } from "~/config";

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Kiểm tra headers đã được gửi chưa
  if (res.headersSent) {
    logger.warn("Headers already sent, skipping errorHandler", {
      path: req.path,
      method: req.method,
    });
    return next(err);
  }

  // 2. Xác định status code và thông tin lỗi
  const statusCode =
    err instanceof AppError
      ? err.statusCode
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const isProduction = config.app.env === "production";
  const isOperational = err instanceof AppError && err.isOperational;

  // 3. Log lỗi chi tiết
  logger.error({
    message: err.message,
    stack: err.stack,
    name: err.name,
    path: req.path,
    method: req.method,
    operational: isOperational,
  });

  // 4. Format response cho production
  if (isProduction && !isOperational) {
    return res.status(statusCode).json({
      status: "error",
      message: "Something went wrong!",
    });
  }

  // 5. Format response chi tiết cho development
  res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message: err.message,
    code: statusCode,
    stack: isOperational ? undefined : err.stack,
    details: err instanceof AppError ? err.details : undefined,
  });
};
