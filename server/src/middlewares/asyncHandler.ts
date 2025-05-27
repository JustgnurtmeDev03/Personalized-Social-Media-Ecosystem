import { Request, Response, NextFunction } from "express";

/*
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
*/

// CẢI TIẾN LẦN 1

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => unknown; // Cho phép mọi kiểu trả về

const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Bọc mọi logic trong Promise để bắt cả lỗi đồng bộ
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
