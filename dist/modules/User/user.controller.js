"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_service_1 = __importDefault(require("./user.service"));
const authentication_middleware_1 = require("../../middleware/authentication.middleware");
const user_authorization_1 = require("./user.authorization");
const validationMiddleware_1 = require("../../middleware/validationMiddleware");
const token_utils_1 = require("../../utils/security/token.utils");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
const validators = __importStar(require("./user.validation"));
const chat_controller_1 = __importDefault(require("../chat/chat.controller"));
const router = (0, express_1.Router)();
router.use("/:userId/chat", chat_controller_1.default);
router.get("/profile", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.profile), user_service_1.default.getProfile);
router.post("/logout", (0, validationMiddleware_1.validation)(validators.logoutSchema), (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.logout), user_service_1.default.logout);
router.post("/refresh-token", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.refreshToken, token_utils_1.TokenEnum.refresh), user_service_1.default.refreshToken);
router.patch("/profile-image", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.profileImage), (0, cloud_multer_1.cloudFileUpload)({
    storageApproach: cloud_multer_1.StorageEnum.memory,
    validation: [...cloud_multer_1.fileValidation.images],
}).single("attachment"), user_service_1.default.profileImage);
router.patch("/profile-cover-image", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.profileImage), (0, cloud_multer_1.cloudFileUpload)({
    storageApproach: cloud_multer_1.StorageEnum.disk,
    validation: [...cloud_multer_1.fileValidation.images],
    maxsize: 3,
}).array("attachments", 5), user_service_1.default.profileCoverImage);
router.post("/:userId/friend-request", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.friendRequest), (0, validationMiddleware_1.validation)(validators.sendFriendRequestSchema), user_service_1.default.friendRequest);
router.patch("/:requestId/accept-friend-request", (0, authentication_middleware_1.authentication)(user_authorization_1.endPoint.acceptRequest), (0, validationMiddleware_1.validation)(validators.acceptFriendRequestSchema), user_service_1.default.acceptRequest);
exports.default = router;
