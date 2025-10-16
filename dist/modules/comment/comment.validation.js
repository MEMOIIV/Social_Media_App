"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crateCommentSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.crateCommentSchema = {
    params: zod_1.default.strictObject({
        postId: validationMiddleware_1.generalField.id,
    }),
    body: zod_1.default
        .strictObject({
        content: zod_1.default.string().min(2).max(2000).optional(),
        attachments: zod_1.default
            .array(validationMiddleware_1.generalField.file(cloud_multer_1.fileValidation.images))
            .max(3)
            .optional(),
        likes: zod_1.default.string().optional(),
        tags: zod_1.default.array(validationMiddleware_1.generalField.id).max(10).optional(),
    })
        .superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "pleas provide content or attachments",
            });
        }
        if (data.tags?.length &&
            data.tags?.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "pleas provide unique tags",
            });
        }
    }),
};
