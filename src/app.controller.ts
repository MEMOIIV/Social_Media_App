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
import {
  createGetPreSignedURL,
  deleteFile,
  deleteFiles,
  deleteFolderByPrefix,
  getFile,
  listDirectoryFiles,
} from "./utils/multer/s3.config";
import successResponse from "./utils/successResponse";
import { UserModel } from "./DB/models/User.model";

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

  // App-Router
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: "Welcome to social media app from TS" });
  });

  // sup-app-routing-modules
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);

  // Delete File
  app.get("/test-s3", async (req: Request, res: Response) => {
    const { Key } = req.query as { Key: string };

    const result = await deleteFile({ Key: Key as string });

    return successResponse({
      res,
      message: "Delete file successfully",
      data: { result },
    });
  });

  // Delete Files
  // app.get("/test", async (req: Request, res: Response) => {
  //   const results = await deleteFiles({
  //     urls: [
  //       "Social_Media_App/users/68d3e9b303e39766a4263deb/cover/5f03d028-2c84-4b0e-9ef9-f39c9d31c9d0-pyramid.jpg",
  //       "Social_Media_App/users/68d3e9b303e39766a4263deb/cover/7d5a2c63-f03d-4269-a8d7-f26390de73b2-bird.jpg",
  //       "Social_Media_App/users/68d3e9b303e39766a4263deb/cover/a6761a97-2924-4b0d-8aa1-9b95b6dae3a9-boat.png",
  //     ],
  //   });
  //   return successResponse({
  //     res,
  //     data: { results },
  //     message: "Deleted files success",
  //   });
  // });

  // list Directory Files

  app.get("/list-deleted-files", async (req: Request, res: Response) => {
    await deleteFolderByPrefix({ path: `users/` });
    return successResponse({ res });
  });

  // get asset with preSignedURL
  app.get("/upload/pre-signed/*path", async (req: Request, res: Response) => {
    const { downloadName, download } = req.query as {
      downloadName?: string;
      download?: string;
    };

    const { path } = req.params as unknown as { path: string[] };

    const Key = path.join("/");

    const url = await createGetPreSignedURL({
      Key,
      downloadName: downloadName as string,
      download: download as string,
      path: path[path.length - 1]?.split(".")[1] || "",
    });
    return successResponse({ res, data: { url } });
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

  // test pre middleware is work \
  try {
    const user = new UserModel({
      fullName: "test test",
      email: `${Date.now()}@gmail.com`,
      password: "Am12345@#",
    });
    await user.save();
    user.lastName = "ali";
    await user .save();
  } catch (error) {
    console.log(error);
  }

  // Global Error Handler Middleware
  app.use(globalErrorHandler);

  // DB
  await connectDB();

  // start-server
  app.listen(port, (): void => {
    console.log(chalk.bgGreen(`Server is running on port ${port} `));
  });

  //
  app.all("/*dummy", (req, res, next) => {});
};
