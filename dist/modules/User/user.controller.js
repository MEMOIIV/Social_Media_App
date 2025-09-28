"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const authentication_middleware_1 = require("../../middleware/authentication.middleware");
const user_authorization_1 = require("./user.authorization");
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
const user_validation_1 = require("./user.validation");
const token_utils_1 = require("../../utils/security/token.utils");
const router = (0, express_1.Router)();
router.get("/profile", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.profile), user_service_1.default.getProfile);
router.post("/logout", (0, validationMiddleware_1.validation)(user_validation_1.logoutSchema), (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.logout), user_service_1.default.logout);
router.post("/refresh-token", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.refreshToken, token_utils_1.TokenEnum.refresh), user_service_1.default.refreshToken);
exports.default = router;
