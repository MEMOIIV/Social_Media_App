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
const friendRequest_model_1 = require("../../DB/models/friendRequest.model");
const err_response_1 = require("../../utils/response/err.response");
const friend_db_repository_1 = require("../../DB/repositories/friend.db.repository");
const mongoose_1 = require("mongoose");
const chat_db_repository_1 = require("../../DB/repositories/chat.db.repository");
const Chat_model_1 = require("../../DB/models/Chat.model");
class UserService {
    _userModel = new user_db_repository_1.UserRepository(User_model_1.UserModel);
    _friendModel = new friend_db_repository_1.FriendRepository(friendRequest_model_1.FriendModel);
    _chatModel = new chat_db_repository_1.ChatRepository(Chat_model_1.ChatModel);
    constructor() { }
    getProfile = async (req, res) => {
        await req.user?.populate("friends");
        const groups = await this._chatModel.find({
            filter: {
                participants: { $in: [req.user?._id] },
                group: { $exists: true },
            },
        });
        if (!groups)
            throw new err_response_1.NotFoundExceptions("Failed to find groups");
        return (0, successResponse_1.default)({
            res,
            data: {
                user: req.user,
                decoded: req.decoded,
                groups,
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
        const { ContentType, Originalname } = req.body;
        const { url, Key } = await (0, s3_config_1.createPreSignedURL)({
            ContentType,
            Originalname,
            path: `users/${req.decoded?._id}`,
        });
        const user = await this._userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update: { profileImage: Key },
        });
        return (0, successResponse_1.default)({
            res,
            statusCode: 201,
            message: "Profile image upload successfully",
            data: { url, Key, user },
        });
    };
    profileCoverImage = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproach: cloud_multer_1.StorageEnum.disk,
            files: req.files,
            path: `users/${req.decoded?._id}/cover`,
        });
        const user = await this._userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update: { coverImages: urls },
        });
        return (0, successResponse_1.default)({
            res,
            statusCode: 201,
            message: "Profile image upload successfully",
            data: { urls, user },
        });
    };
    friendRequest = async (req, res) => {
        const { userId } = req.params;
        const checkFriendRequestExists = await this._friendModel.findOne({
            filter: {
                createdBy: { $in: [req.user?._id, userId] },
                sendTo: { $in: [req.user?._id, userId] },
            },
        });
        if (checkFriendRequestExists)
            throw new err_response_1.ConflictExceptions("Friends request already exists");
        const user = await this._userModel.findOne({
            filter: {
                _id: userId,
            },
        });
        if (!user)
            throw new err_response_1.NotFoundExceptions("User not found");
        if (userId === req.user?._id.toString()) {
            throw new err_response_1.BadRequestExceptions("You can't send a friend request to yourself");
        }
        const [friend] = (await this._friendModel.create({
            data: [
                {
                    createdBy: req.user?._id,
                    sendTo: new mongoose_1.Types.ObjectId(userId),
                },
            ],
        })) || [];
        if (!friend)
            throw new err_response_1.BadRequestExceptions("Fail to send friend request");
        return (0, successResponse_1.default)({
            res,
            statusCode: 201,
            message: "Send friend request successfully",
            data: friend,
        });
    };
    acceptRequest = async (req, res) => {
        const { requestId } = req.params;
        const friend = await this._friendModel.findOne({
            filter: {
                _id: requestId,
                sendTo: req.user?._id,
            },
        });
        if (!friend)
            throw new err_response_1.NotFoundExceptions("Friend request not found");
        if (friend.acceptedAt)
            throw new err_response_1.NotFoundExceptions("You are already friends with this user");
        const acceptRequest = await this._friendModel.updateOne({
            filter: { _id: requestId },
            update: {
                acceptedAt: Date.now(),
            },
        });
        if (acceptRequest.modifiedCount === 0) {
            throw new err_response_1.BadRequestExceptions("Failed to accept the friend request");
        }
        const updateFriends = await Promise.all([
            await this._userModel.updateOne({
                filter: { _id: friend.createdBy },
                update: { $addToSet: { friends: friend.sendTo } },
            }),
            await this._userModel.updateOne({
                filter: { _id: friend.sendTo },
                update: { $addToSet: { friends: friend.createdBy } },
            }),
        ]);
        if (!updateFriends[0].modifiedCount || !updateFriends[1].modifiedCount) {
            throw new err_response_1.BadRequestExceptions("Failed to update friends list");
        }
        return (0, successResponse_1.default)({
            res,
            message: "Friend request accepted successfully",
        });
    };
}
exports.default = new UserService();
