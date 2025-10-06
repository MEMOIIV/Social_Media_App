"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const successResponse_1 = __importDefault(require("../../utils/successResponse"));
const User_model_1 = require("../../DB/models/User.model");
const user_db_repository_1 = require("../../DB/repositories/user.db.repository");
const token_utils_1 = require("../../utils/security/token.utils");
const s3_config_1 = require("../../utils/multer/s3.config");
const cloud_multer_1 = require("../../utils/multer/cloud.multer");
class UserService {
    _userModel = new user_db_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    getProfile = async (req, res) => {
        return (0, successResponse_1.default)({
            res,
            data: {
                user: req.user,
            },
        });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case User_model_1.LogoutEnum.all:
                update.changeCredentialsTime = Date.now();
                break;
            case User_model_1.LogoutEnum.only:
                await (0, token_utils_1.revokeToken)(req.decoded);
                statusCode = 201;
                break;
            default:
                break;
        }
        await this._userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update,
        });
        return (0, successResponse_1.default)({
            res,
            statusCode,
        });
    };
    refreshToken = async (req, res) => {
        const newCredentials = await (0, token_utils_1.createLoginCredentials)(req.user);
        await (0, token_utils_1.revokeToken)(req.decoded);
        return (0, successResponse_1.default)({ res, data: newCredentials, statusCode: 201 });
    };
    profileImage = async (req, res) => {
        const { ContentType, originalname } = req.body;
        const { url, Key } = await (0, s3_config_1.createPreSignedURL)({
            ContentType,
            originalname,
            path: `users/${req.decoded?._id}`,
        });
        return (0, successResponse_1.default)({
            res,
            statusCode: 201,
            message: "Profile image upload successfully",
            data: { url, Key },
        });
    };
    profileCoverImage = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproach: cloud_multer_1.StorageEnum.disk,
            files: req.files,
            path: `users/${req.decoded?._id}/cover`,
        });
        return (0, successResponse_1.default)({
            res,
            statusCode: 201,
            message: "Profile image upload successfully",
            data: { urls },
        });
    };
}
exports.default = new UserService();
