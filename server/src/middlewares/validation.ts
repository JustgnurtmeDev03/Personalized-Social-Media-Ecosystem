import { Request, Response, NextFunction } from "express";
import { check, validationResult } from "express-validator";
import mongoose from "mongoose";
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/message";
import { HttpError } from "~/utils/httpError";

// Validator cho đăng ký
export const validateRegister = [
  check("name").notEmpty().withMessage("Name is required"),
];
check("email").isEmail().withMessage("Email is invalid"),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };

// Validator cho đăng nhập
export const validateLogin = [
  check("email").isEmail().withMessage("Email is invalid"),
  check("password").notEmpty().withMessage("password is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Validator cho refresh token và logout
export const validateRefreshToken = [
  check("refreshToken").notEmpty().withMessage("Refresh Token is required"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateObjectId = (param: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const _id = req.params[param];
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        USERS_MESSAGES.ID_IS_INVALID
      );
    }
    next();
  };
};
