import express from "express";
import { type Express, type Request, type Response } from "express";
import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { globalErrorHandler } from "./utils/response/err.response";
import connectDB from "./DB/connection.db";
import authRouter from "./modules/Auth/auth.controller";
import userRouter from "./modules/User/user.controller";
import { config } from "dotenv";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import chalk from "chalk";

config({ path: path.resolve("./config/.env.dev") });

const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 100, // 100 request in 15 min
  message: {
    status: 429,
    message: "Too ,many request from this IP , pleas try again later",
  },
});

export const bootstrap = async (): Promise<void> => {
  const app: Express = express();
  const port: number = Number(process.env.PORT as string) || 5000;
  app.use(cors(), express.json(), helmet(), limiter); // Global Middleware
  
  // DB
  await connectDB();

  // Router
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: "Welcome to social media app from TS" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);

  app.listen(port, (): void => {
    console.log(chalk.bgGreen(`Server is running on port ${port} `));
  });

  // Global Error Handler Middleware
  app.use(globalErrorHandler);
  app.all("/*dummy", (req, res, next) => {});
};
