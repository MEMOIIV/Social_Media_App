"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.signupSchema = {
    body: zod_1.default.object({
        username: zod_1.default.string().min(2).max(20),
        email: zod_1.default.email(),
        password: zod_1.default.string().min(8).max(12)
    })
};
