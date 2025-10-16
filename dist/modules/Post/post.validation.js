"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPostsSchema = exports.updatePostSchema = exports.likeAndUnlikePostSchema = exports.cratePostSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const Post_model_1 = require("../../DB/models/Post.model");
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.cratePostSchema = {
    body: zod_1.default
        .strictObject({
        content: zod_1.default.string().min(2).max(2000).optional(),
        attachments: zod_1.default
            .array(validationMiddleware_1.generalField.file(cloud_multer_1.fileValidation.images))
            .max(3)
            .optional(),
        allowComments: zod_1.default.enum(Post_model_1.AllowCommentsEnum).default(Post_model_1.AllowCommentsEnum.Allow),
        availability: zod_1.default.enum(Post_model_1.AvailabilityEnum).default(Post_model_1.AvailabilityEnum.Public),
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
exports.likeAndUnlikePostSchema = {
    params: zod_1.default.strictObject({
        postId: validationMiddleware_1.generalField.id,
    }),
    query: zod_1.default.strictObject({
        action: zod_1.default.enum(Post_model_1.ActionEnum).default(Post_model_1.ActionEnum.like),
    }),
};
exports.updatePostSchema = {
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
        allowComments: zod_1.default.enum(Post_model_1.AllowCommentsEnum).default(Post_model_1.AllowCommentsEnum.Allow),
        availability: zod_1.default.enum(Post_model_1.AvailabilityEnum).default(Post_model_1.AvailabilityEnum.Public),
        likes: zod_1.default.string().optional(),
        tags: zod_1.default.array(validationMiddleware_1.generalField.id).max(10).optional(),
        removedTags: zod_1.default.array(validationMiddleware_1.generalField.id).max(10).optional(),
        removedAttachments: zod_1.default.array(zod_1.default.string()).max(3).optional(),
    })
        .superRefine((data, ctx) => {
        if (data.tags?.length &&
            data.tags?.length !== [...new Set(data.tags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["tags"],
                message: "pleas provide unique tags",
            });
        }
        if (data.removedTags?.length &&
            data.removedTags?.length !== [...new Set(data.removedTags)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["removedTags"],
                message: "pleas provide unique removedTags",
            });
        }
    }),
};
exports.getPostsSchema = {
    query: zod_1.default.strictObject({
        page: zod_1.default.coerce.number(),
        limit: zod_1.default.coerce.number(),
    }),
};
