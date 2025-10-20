import type { Request, Response } from "express";
import { IGwtChatParams, IMessageDTO, ISayHiDTO } from "./chat.dto";
import { UserRepository } from "../../DB/repositories/user.db.repository";
import { UserModel } from "../../DB/models/User.model";
import { ChatRepository } from "../../DB/repositories/chat.db.repository";
import { ChatModel } from "../../DB/models/Chat.model";
import {
  BadRequestExceptions,
  NotFoundExceptions,
} from "../../utils/response/err.response";
import successResponse from "../../utils/successResponse";
import { Types } from "mongoose";
import { populate } from "dotenv";
import { Type } from "@aws-sdk/client-s3";

class ChatService {
  private _userModel = new UserRepository(UserModel);
  private _chatModel = new ChatRepository(ChatModel);

  constructor() {}

  // REST API
  getChat = async (req: Request, res: Response) => {
    const { userId } = req.params as IGwtChatParams;

    // OVO
    const chat = await this._chatModel.findOne({
      filter: {
        participants: {
          $all: [
            req.user?._id as Types.ObjectId,
            Types.ObjectId.createFromHexString(userId),
          ],
        },
        group: { $exists: false },
      },
      options: {
        populate: "participants",
      },
    });

    if (!chat) throw new NotFoundExceptions(" Fail to find chat");

    return successResponse({ res, data: { chat } });
  };
  // SOCKET IO
  sayHi = ({ socket, message, callback, io }: ISayHiDTO) => {
    try {
      console.log(message);
      callback ? callback("I received your message") : undefined;
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };

  sendMessage = async ({ content, sendTo, socket, io }: IMessageDTO) => {
    try {
      const createdBy = socket.credentials?.user?._id as Types.ObjectId;
      const user = await this._userModel.findOne({
        filter: {
          _id: Types.ObjectId.createFromHexString(sendTo),
          friends: { $in: [createdBy] },
        },
      });

      if (!user) throw new NotFoundExceptions("Fail to find user");

      // check if chat already exists and update it
      const chat = await this._chatModel.findOneAndUpdate({
        filter: {
          participants: {
            $all: [createdBy, Types.ObjectId.createFromHexString(sendTo)],
          },
          group: { $exists: false },
        },
        update: {
          $addToSet: {
            messages: {
              content, // key same value
              createdBy,
            },
          },
        },
      });

      // if chat not exists
      if (!chat) {
        const [newChat] =
          (await this._chatModel.create({
            data: [
              {
                createdBy,
                messages: [{ content, createdBy }],
                participants: [
                  createdBy,
                  Types.ObjectId.createFromHexString(sendTo),
                ],
              },
            ],
          })) || [];

        if (!newChat)
          throw new BadRequestExceptions("Fail to created new chat");
      }

      io.emit("successMessage", { content });
      io.emit("newMessage", { content, from: socket.credentials?.user });
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };
}

export default new ChatService();
