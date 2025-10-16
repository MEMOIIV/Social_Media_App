"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptFriendRequestSchema = exports.sendFriendRequestSchema = exports.PresignedURL = exports.logoutSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const User_model_1 = require("../../DB/models/User.model");
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
exports.logoutSchema = {
    body: zod_1.default.strictObject({
        flag: zod_1.default.enum(User_model_1.LogoutEnum).default(User_model_1.LogoutEnum.only)
    })
};
exports.PresignedURL = {
    body: zod_1.default.strictObject({
        ContentType: zod_1.default.string(),
        Originalname: zod_1.default.string(),
    })
};
exports.sendFriendRequestSchema = {
    params: zod_1.default.strictObject({
        userId: validationMiddleware_1.generalField.id
    })
};
exports.acceptFriendRequestSchema = {
    params: zod_1.default.strictObject({
        requestId: validationMiddleware_1.generalField.id
    })
};
