"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmEmailSchema = exports.signupSchema = exports.loginSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
exports.loginSchema = {
    body: zod_1.default.strictObject({
        email: validationMiddleware_1.generalField.email,
        password: validationMiddleware_1.generalField.password,
    }),
};
exports.signupSchema = {
    body: exports.loginSchema.body
        .extend({
        fullName: validationMiddleware_1.generalField.fullName,
        confirmPassword: validationMiddleware_1.generalField.confirmPassword,
    })
        .superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "password mismatch",
            });
        }
    }),
};
exports.confirmEmailSchema = {
    body: zod_1.default.strictObject({
        email: validationMiddleware_1.generalField.email,
        otp: validationMiddleware_1.generalField.otp,
    }),
};
