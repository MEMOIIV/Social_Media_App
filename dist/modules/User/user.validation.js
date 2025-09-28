"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const User_model_1 = require("../../DB/models/User.model");
exports.logoutSchema = {
    body: zod_1.default.strictObject({
        flag: zod_1.default.enum(User_model_1.LogoutEnum).default(User_model_1.LogoutEnum.only)
    })
};
