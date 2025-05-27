import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "~/models/User";
import { config } from "dotenv";
config();

export interface AuthenticatedRequest extends Request {
  user?: any;
  token?: string;
}

const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header("Authorization");
    // console.log("Auth Header:", authHeader);
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const accessToken = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET as string
    ) as { id: string };

    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      throw new Error("User not found");
    }

    req.user = user;
    req.token = accessToken;
    next();
  } catch (error) {
    res.status(401).send({ error: " Please authenticate" });
  }
};

export default authMiddleware;
