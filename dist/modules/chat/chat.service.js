"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_db_repository_1 = require("../../DB/repositories/user.db.repository");
const User_model_1 = require("../../DB/models/User.model");
const chat_db_repository_1 = require("../../DB/repositories/chat.db.repository");
const Chat_model_1 = require("../../DB/models/Chat.model");
const err_response_1 = require("../../utils/response/err.response");
const successResponse_1 = __importDefault(require("../../utils/successResponse"));
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const s3_config_1 = require("../../utils/multer/s3.config");
const gateway_1 = require("../gateway/gateway");
const chat_validation_1 = require("./chat.validation");
class ChatService {
    _userModel = new user_db_repository_1.UserRepository(User_model_1.UserModel);
    _chatModel = new chat_db_repository_1.ChatRepository(Chat_model_1.ChatModel);
    constructor() { }
    getChat = async (req, res) => {
        const { userId } = req.params;
        const chat = await this._chatModel.findOne({
            filter: {
                participants: {
                    $all: [
                        req.user?._id,
                        mongoose_1.Types.ObjectId.createFromHexString(userId),
                    ],
                },
                group: { $exists: false },
            },
            options: {
                populate: "participants",
            },
        });
        if (!chat)
            throw new err_response_1.NotFoundExceptions(" Fail to find chat");
        return (0, successResponse_1.default)({ res, data: { chat } });
    };
    createGroupChat = async (req, res) => {
        const { participants, group } = req.body;
        const dbParticipants = participants.map((participant) => {
            return mongoose_1.Types.ObjectId.createFromHexString(participant);
        });
        const users = await this._userModel.find({
            filter: {
                _id: { $in: dbParticipants },
                friends: { $in: [req.user?._id, dbParticipants] },
            },
        });
        if (dbParticipants.length !== users.length)
            throw new err_response_1.BadRequestExceptions("Some or all recipient all invalid");
        const roomId = group.replaceAll(/\s+/g, "_") + "_" + (0, uuid_1.v4)();
        let group_image = undefined;
        if (req.file) {
            group_image = await (0, s3_config_1.uploadFile)({
                file: req.file,
                path: `chat/${roomId}`,
            });
        }
        const [newGroup] = (await this._chatModel.create({
            data: [
                {
                    participants: [...dbParticipants, req.user?._id],
                    group,
                    roomId,
                    createdBy: req.user?._id,
                    group_image: group_image,
                },
            ],
        })) || [];
        if (!newGroup) {
            if (group_image) {
                await (0, s3_config_1.deleteFile)({ Key: group_image });
            }
            throw new err_response_1.BadRequestExceptions("Failed to create group chat");
        }
        (0, successResponse_1.default)({ res, data: { newGroup } });
    };
    getGroupChat = async (req, res) => {
        const { groupId } = req.params;
        const chat = await this._chatModel.findOne({
            filter: {
                _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                group: { $exists: true },
                participants: { $in: [req.user?._id] },
            },
            options: {
                populate: "messages.createdBy",
            },
        });
        if (!chat)
            throw new err_response_1.NotFoundExceptions("failed to find group");
        (0, successResponse_1.default)({ res, data: { chat } });
    };
    sayHi = ({ socket, message, callback, io }) => {
        try {
            callback ? callback("I received your message") : undefined;
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    sendMessage = async ({ content, sendTo, socket, io }) => {
        try {
            const { content: validContent, sendTo: validSendTo } = chat_validation_1.chatMessageSchema.parse({
                content,
                sendTo,
            });
            const createdBy = socket.credentials?.user?._id;
            const user = await this._userModel.findOne({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(validSendTo),
                    friends: { $in: [createdBy] },
                },
            });
            if (!user)
                throw new err_response_1.NotFoundExceptions("Fail to find user");
            const chat = await this._chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [createdBy, mongoose_1.Types.ObjectId.createFromHexString(validSendTo)],
                    },
                    group: { $exists: false },
                },
                update: {
                    $addToSet: {
                        messages: {
                            content: validContent,
                            createdBy,
                        },
                    },
                },
            });
            if (!chat) {
                const [newChat] = (await this._chatModel.create({
                    data: [
                        {
                            createdBy,
                            messages: [{ content: validContent, createdBy }],
                            participants: [
                                createdBy,
                                mongoose_1.Types.ObjectId.createFromHexString(validSendTo),
                            ],
                        },
                    ],
                })) || [];
                if (!newChat)
                    throw new err_response_1.BadRequestExceptions("Fail to created new chat");
            }
            io?.emit("successMessage", { content: validContent });
            io?.emit("newMessage", {
                content: validContent,
                from: socket.credentials?.user,
            });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    joinRoom = async ({ roomId, socket, io }) => {
        try {
            const chat = await this._chatModel.findOne({
                filter: {
                    roomId,
                    participants: {
                        $in: [socket.credentials?.user?._id],
                    },
                    group: { $exists: true },
                },
            });
            if (!chat)
                throw new err_response_1.NotFoundExceptions("Failed to join rooms");
            socket.join(chat.roomId);
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    sendGroupMessage = async ({ content, groupId, socket, io, }) => {
        try {
            const { content: validContent } = chat_validation_1.chatGroupMessageSchema.parse({
                content,
            });
            const createdBy = socket.credentials?.user?._id;
            const chat = await this._chatModel.findOneAndUpdate({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(groupId),
                    participants: { $in: [createdBy] },
                    group: { $exists: true },
                },
                update: {
                    $addToSet: {
                        messages: {
                            content: validContent,
                            createdBy,
                        },
                    },
                },
            });
            if (!chat)
                throw new err_response_1.BadRequestExceptions("Failed to create message");
            io?.emit("successMessage", { content: validContent });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    userTyping = async ({ to, socket, io }) => {
        try {
            const fromUser = socket.credentials?.user;
            if (!fromUser || !to)
                return;
            const receivers = gateway_1.connectedSockets.get(to);
            if (!receivers?.length)
                return;
            io.to(receivers).emit("userTyping", {
                from: fromUser._id,
                fullName: fromUser.fullName,
            });
        }
        catch (error) {
            socket.emit("custom_error", { message: "Error in userTyping", error });
        }
    };
    userStopTyping = async ({ to, socket, io }) => {
        try {
            const fromUser = socket.credentials?.user;
            if (!fromUser || !to)
                return;
            const receivers = gateway_1.connectedSockets.get(to);
            if (!receivers?.length)
                return;
            io.to(receivers).emit("userStopTyping", {
                from: fromUser._id,
            });
        }
        catch (error) {
            socket.emit("custom_error", {
                message: "Error in userStopTyping",
                error,
            });
        }
    };
    userTypingGroup = async ({ groupId, socket, io }) => {
        const fromUser = socket.credentials?.user;
        if (!fromUser || !groupId || !fromUser._id)
            return;
        const groupChat = await this._chatModel.findById({
            id: new mongoose_1.Types.ObjectId(groupId),
            options: { populate: ["messages.createdBy"] },
        });
        console.log(groupChat);
        if (!groupChat)
            return;
        const otherParticipants = groupChat.participants.filter((id) => id.toString() !== fromUser._id?.toString());
        otherParticipants.forEach((participantId) => {
            const receivers = gateway_1.connectedSockets.get(participantId.toString());
            console.log("Sending typing to:", participantId.toString(), "receivers:", receivers);
            if (receivers?.length) {
                io.to(receivers).emit("userTypingGroup", {
                    from: fromUser._id,
                    fullName: fromUser.fullName,
                });
            }
        });
    };
    userStopTypingGroup = async ({ groupId, socket, io }) => {
        const fromUser = socket.credentials?.user;
        if (!fromUser || !groupId || !fromUser._id)
            return;
        const groupChat = await this._chatModel.findById({
            id: new mongoose_1.Types.ObjectId(groupId),
        });
        console.log(groupChat);
        if (!groupChat)
            return;
        const otherParticipants = groupChat.participants.filter((id) => id.toString() !== fromUser._id?.toString());
        otherParticipants.forEach((participantId) => {
            const receivers = gateway_1.connectedSockets.get(participantId.toString());
            if (receivers?.length) {
                io.to(receivers).emit("userStopTypingGroup", {
                    from: fromUser._id,
                    fullName: fromUser.fullName,
                });
            }
        });
    };
}
exports.default = new ChatService();
