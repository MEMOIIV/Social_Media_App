"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalField = exports.validation = void 0;
const zod_1 = __importDefault(require("zod"));
const err_response_1 = require("../utils/response/err.response");
const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const kye of Object.keys(schema)) {
            if (!schema[kye])
                continue;
            const validationResult = schema[kye].safeParse(req[kye]);
            if (!validationResult.success) {
                const errors = validationResult.error;
                validationErrors.push({
                    kye,
                    issues: errors.issues.map((issue) => {
                        return { message: issue.message, path: issue.path };
                    }),
                });
            }
            if (validationErrors.length > 0)
                throw new err_response_1.BadRequestExceptions("validation errors", {
                    cause: validationErrors,
                });
        }
        return next();
    };
};
exports.validation = validation;
exports.generalField = {
    fullName: zod_1.default
        .string({ error: "username must be string" })
        .min(2, { error: "min length must be 2" })
        .max(20, { error: "max length must be 20" }),
    email: zod_1.default.email({ error: "invalid email" }),
    password: zod_1.default
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(12, "Password must be a maximum of 12 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/\d/, "Password must contain at least one digit")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: zod_1.default.string(),
    otp: zod_1.default.string().regex(/^\d{6}/),
};
