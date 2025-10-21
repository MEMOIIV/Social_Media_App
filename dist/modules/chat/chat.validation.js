"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatGroupMessageSchema = exports.chatMessageSchema = exports.getGroupChatSchema = exports.groupChatSchema = exports.chatSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
exports.chatSchema = {
    params: zod_1.default.strictObject({
        userId: validationMiddleware_1.generalField.id,
    }),
};
exports.groupChatSchema = {
    body: zod_1.default
        .strictObject({
        participants: zod_1.default.array(validationMiddleware_1.generalField.id).min(1),
        group: zod_1.default.string().min(1).max(100),
        attachments: validationMiddleware_1.generalField.file(cloud_multer_1.fileValidation.images).optional(),
    })
        .superRefine((data, ctx) => {
        if (data.participants.length &&
            data.participants.length !== [...new Set(data.participants)].length) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Please Provider Unique participants",
            });
        }
    }),
};
exports.getGroupChatSchema = {
    params: zod_1.default.strictObject({
        groupId: validationMiddleware_1.generalField.id,
    }),
};
exports.chatMessageSchema = zod_1.default.strictObject({
    content: zod_1.default.string().min(1, "Message cannot be empty"),
    sendTo: zod_1.default.string().min(1, "Recipient ID is required"),
});
exports.chatGroupMessageSchema = zod_1.default.strictObject({
    content: zod_1.default.string().min(1, "Message cannot be empty"),
});
