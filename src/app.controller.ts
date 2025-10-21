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
import postRouter from "./modules/Post/post.controller";
import chatRouter from "./modules/chat/chat.controller";
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
  deleteFolderByPrefix,
  getFile,
} from "./utils/multer/s3.config";
import successResponse from "./utils/successResponse";
import { initialize } from "./modules/gateway/gateway";

const createS3WriteStreamPipe = promisify(pipeline);

// 1. Load environment variables
config({ path: path.resolve("./config/.env.dev") });

// 2. Setup rate limiter
const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 100, // 100 request in 15 min
  message: {
    status: 429,
    message: "Too ,many request from this IP , pleas try again later",
  },
});

export const bootstrap = async (): Promise<void> => {
  // 3. Connect to database
  await connectDB();

  // 4. Initialize express app and global middlewares
  const app: Express = express();
  const port: number = Number(process.env.PORT as string) || 5000;
  app.use(cors(), express.json(), helmet(), limiter); // Global Middleware
  app.use(express.urlencoded({ extended: true }));

  // 5. Health check route
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ message: "Welcome to social media app from TS" });
  });

  // 6. Register routers
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/post", postRouter);
  app.use("/api/chat", chatRouter);

  // 7. S3 service routes
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

  // 8. Catch-all route for undefined endpoints
  app.all("/*dummy", (req: Request, res: Response) => {
    res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
  });

  // 9. Global error handler (must be last middleware)
  app.use(globalErrorHandler);

  // 10. Start server
  const httpServer = app.listen(port, (): void => {
    console.log(chalk.bgGreen(`Server is running on port ${port} `));
  });

  // 11. Socket io
  initialize(httpServer);
};
