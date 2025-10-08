"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = void 0;
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const err_response_1 = require("./utils/response/err.response");
const connection_db_1 = __importDefault(require("./DB/connection.db"));
const auth_controller_1 = __importDefault(require("./modules/Auth/auth.controller"));
const user_controller_1 = __importDefault(require("./modules/User/user.controller"));
const post_controller_1 = __importDefault(require("./modules/Post/post.controller"));
const dotenv_1 = require("dotenv");
const node_path_1 = __importDefault(require("node:path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const chalk_1 = __importDefault(require("chalk"));
const node_util_1 = require("node:util");
const node_stream_1 = require("node:stream");
const s3_config_1 = require("./utils/multer/s3.config");
const successResponse_1 = __importDefault(require("./utils/successResponse"));
const createS3WriteStreamPipe = (0, node_util_1.promisify)(node_stream_1.pipeline);
(0, dotenv_1.config)({ path: node_path_1.default.resolve("./config/.env.dev") });
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: {
        status: 429,
        message: "Too ,many request from this IP , pleas try again later",
    },
});
const bootstrap = async () => {
    await (0, connection_db_1.default)();
    const app = (0, express_1.default)();
    const port = Number(process.env.PORT) || 5000;
    app.use((0, cors_1.default)(), express_1.default.json(), (0, helmet_1.default)(), limiter);
    app.get("/", (req, res) => {
        res.status(200).json({ message: "Welcome to social media app from TS" });
    });
    app.use("/api/auth", auth_controller_1.default);
    app.use("/api/user", user_controller_1.default);
    app.use("/api/post", post_controller_1.default);
    app.get("/test-s3", async (req, res) => {
        const { Key } = req.query;
        const result = await (0, s3_config_1.deleteFile)({ Key: Key });
        return (0, successResponse_1.default)({
            res,
            message: "Delete file successfully",
            data: { result },
        });
    });
    app.get("/list-deleted-files", async (req, res) => {
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `users/` });
        return (0, successResponse_1.default)({ res });
    });
    app.get("/upload/pre-signed/*path", async (req, res) => {
        const { downloadName, download } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const url = await (0, s3_config_1.createGetPreSignedURL)({
            Key,
            downloadName: downloadName,
            download: download,
            path: path[path.length - 1]?.split(".")[1] || "",
        });
        return (0, successResponse_1.default)({ res, data: { url } });
    });
    app.get("/upload/*path", async (req, res) => {
        const { downloadName } = req.query;
        const { path } = req.params;
        const Key = path.join("/");
        const s3Response = await (0, s3_config_1.getFile)({ Key });
        if (!s3Response?.Body)
            throw new err_response_1.BadRequestExceptions("Fail to get asset");
        res.setHeader("Content-Type", `${s3Response.ContentType}` || "application/octet-stream");
        if (downloadName) {
            res.setHeader("Content-Disposition", `attachment; filename="${downloadName}.${path[path.length - 1]?.split(".")[1]}"`);
        }
        return createS3WriteStreamPipe(s3Response.Body, res);
    });
    app.all("/*dummy", (req, res) => {
        res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
    });
    app.use(err_response_1.globalErrorHandler);
    app.listen(port, () => {
        console.log(chalk_1.default.bgGreen(`Server is running on port ${port} `));
    });
};
exports.bootstrap = bootstrap;
