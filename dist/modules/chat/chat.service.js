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
    sayHi = ({ socket, message, callback, io }) => {
        try {
            console.log(message);
            callback ? callback("I received your message") : undefined;
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
    sendMessage = async ({ content, sendTo, socket, io }) => {
        try {
            const createdBy = socket.credentials?.user?._id;
            const user = await this._userModel.findOne({
                filter: {
                    _id: mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                    friends: { $in: [createdBy] },
                },
            });
            if (!user)
                throw new err_response_1.NotFoundExceptions("Fail to find user");
            const chat = await this._chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [createdBy, mongoose_1.Types.ObjectId.createFromHexString(sendTo)],
                    },
                    group: { $exists: false },
                },
                update: {
                    $addToSet: {
                        messages: {
                            content,
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
                            messages: [{ content, createdBy }],
                            participants: [
                                createdBy,
                                mongoose_1.Types.ObjectId.createFromHexString(sendTo),
                            ],
                        },
                    ],
                })) || [];
                if (!newChat)
                    throw new err_response_1.BadRequestExceptions("Fail to created new chat");
            }
            io.emit("successMessage", { content });
            io.emit("newMessage", { content, from: socket.credentials?.user });
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
}
exports.default = new ChatService();
