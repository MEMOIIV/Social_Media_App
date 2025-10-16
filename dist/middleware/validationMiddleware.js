"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalField = exports.validation = void 0;
const zod_1 = __importDefault(require("zod"));
const err_response_1 = require("../utils/response/err.response");
const mongoose_1 = require("mongoose");
const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const kye of Object.keys(schema)) {
            if (!schema[kye])
                continue;
            if (req.file) {
                req.body.attachments = req.file;
            }
            if (req.files) {
                req.body.attachments = req.files;
            }
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
    file: function (mimetypes) {
        return zod_1.default
            .strictObject({
            fieldname: zod_1.default.string(),
            originalname: zod_1.default.string(),
            encoding: zod_1.default.string(),
            mimetype: zod_1.default.string(),
            buffer: zod_1.default.any().optional(),
            path: zod_1.default.string().optional(),
            size: zod_1.default.number(),
        })
            .refine((data) => {
            return data.buffer || data.path;
        }, { message: "Please provide a file " })
            .refine((file) => {
            return mimetypes.includes(file.mimetype);
        }, { message: `Invalid file type. Allowed types: ${mimetypes.join(", ")}` });
    },
    id: zod_1.default
        .string()
        .refine((data) => mongoose_1.Types.ObjectId.isValid(data), {
        message: "In-valid tag id",
    }),
};
