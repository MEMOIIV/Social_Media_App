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
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const router = (0, express_1.Router)();
router.get("/profile", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.profile), user_service_1.default.getProfile);
router.post("/logout", (0, validationMiddleware_1.validation)(user_validation_1.logoutSchema), (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.logout), user_service_1.default.logout);
router.post("/refresh-token", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.refreshToken, token_utils_1.TokenEnum.refresh), user_service_1.default.refreshToken);
router.patch("/profile-image", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.profileImage), (0, cloud_multer_1.cloudFileUpload)({
    storageApproach: cloud_multer_1.StorageEnum.memory,
    validation: [...cloud_multer_1.fileValidation.images],
}).single("attachment"), user_service_1.default.profileImage);
router.patch("/profile-cover-image", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.profileImage), (0, cloud_multer_1.cloudFileUpload)({
    storageApproach: cloud_multer_1.StorageEnum.disk,
    validation: [...cloud_multer_1.fileValidation.images],
    maxsize: 3,
}).array("attachment", 5), user_service_1.default.profileCoverImage);
exports.default = router;
