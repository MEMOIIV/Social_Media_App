"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = __importDefault(require("./auth.service"));
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
const auth_validation_1 = require("./auth.validation");
const router = (0, express_1.Router)();
router.post("/signup-gmail", (0, validationMiddleware_1.validation)(auth_validation_1.signupWithGmailSchema), auth_service_1.default.signupWithGmail);
router.post("/login-gmail", (0, validationMiddleware_1.validation)(auth_validation_1.signupWithGmailSchema), auth_service_1.default.loginWithGmail);
router.post("/signup", (0, validationMiddleware_1.validation)(auth_validation_1.signupSchema), auth_service_1.default.signup);
router.patch("/confirmEmail", (0, validationMiddleware_1.validation)(auth_validation_1.confirmEmailSchema), auth_service_1.default.confirmEmail);
router.post("/login", (0, validationMiddleware_1.validation)(auth_validation_1.loginSchema), auth_service_1.default.login);
exports.default = router;
