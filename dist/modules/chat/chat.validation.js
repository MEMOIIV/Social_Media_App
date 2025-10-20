"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
exports.chatSchema = {
    params: zod_1.default.strictObject({
        userId: validationMiddleware_1.generalField.id,
    }),
};
