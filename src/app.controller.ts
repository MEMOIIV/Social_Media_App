import express from "express";
import { type Express, type Request, type Response } from "express";
import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import {
  BadRequestExceptions,
  globalErrorHandler,
} from "./utils/response/err.response";
import connectDB from "./DB/connection.db";
import authRouter from "./modules/Auth/auth.controller";
import userRouter from "./modules/User/user.controller";
import { config } from "dotenv";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import chalk from "chalk";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import { createGetPreSignedURL, getFile } from "./utils/multer/s3.config";
import successResponse from "./utils/successResponse";

const createS3WriteStreamPipe = promisify(pipeline);

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

  // get asset
  app.get("/upload/*path", async (req: Request, res: Response) => {
    const { downloadName } = req.query as { downloadName?: string };
    const { path } = req.params as unknown as { path: string[] };
    const Key = path.join("/");
    const s3Response = await getFile({ Key });
    if (!s3Response?.Body) throw new BadRequestExceptions("Fail to get asset");
    res.setHeader(
      "Content-Type",
      `${s3Response.ContentType}` || "application/octet-stream"
    );

    if (downloadName) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadName}.${
          path[path.length - 1]?.split(".")[1]
        }"`
      );
    }

    return createS3WriteStreamPipe(
      s3Response.Body as NodeJS.ReadableStream,
      res
    );
  });

  // get asset with preSignedURL
  app.get("/upload-pre-signed/*path", async (req: Request, res: Response) => {
    const { downloadName, download } = req.query as {
      downloadName?: string;
      download?: string;
    };

    const { path } = req.params as unknown as { path: string[] };

    const Key = path.join("/");

    const url = await createGetPreSignedURL({
      Key,
      downloadName : downloadName as string,
      download : download as string,
      path: path[path.length - 1]?.split(".")[1] || ""
    })
    return successResponse({res , data:{url}})
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
