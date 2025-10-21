import type { Request, Response } from "express";
import {
  ICreateGroupChatBody,
  IGetGroupChatParams,
  IGwtChatParams,
  IJoinRoomDTO,
  IMessageDTO,
  ISayHiDTO,
  ISendGroupMessageDTO,
  ITypingChatDTO,
  ITypingGroupDTO,
} from "./chat.dto";
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
import { v4 as uuid } from "uuid";
import { deleteFile, uploadFile } from "../../utils/multer/s3.config";
import { connectedSockets } from "../gateway/gateway";
import { chatGroupMessageSchema, chatMessageSchema } from "./chat.validation";

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

  createGroupChat = async (req: Request, res: Response) => {
    // destruct value from req.body
    const { participants, group } = req.body as ICreateGroupChatBody;

    // refactor participant from string to ObjectId
    const dbParticipants = participants.map((participant) => {
      return Types.ObjectId.createFromHexString(participant);
    });

    // check if users already exist, are friends with each other, and with the logged-in user
    const users = await this._userModel.find({
      filter: {
        _id: { $in: dbParticipants },
        friends: { $in: [req.user?._id as Types.ObjectId, dbParticipants] },
      },
    });

    // check if both arrays have the same length
    if (dbParticipants.length !== users.length)
      throw new BadRequestExceptions("Some or all recipient all invalid");

    // create roomId using UUID for uniqueness
    const roomId = group.replaceAll(/\s+/g, "_") + "_" + uuid();

    // create image group
    let group_image: string | undefined = undefined;
    if (req.file) {
      group_image = await uploadFile({
        file: req.file as Express.Multer.File,
        path: `chat/${roomId}`,
      });
    }

    // create group chat
    const [newGroup] =
      (await this._chatModel.create({
        data: [
          {
            participants: [...dbParticipants, req.user?._id as Types.ObjectId],
            group, // key same value
            roomId, // ky same value
            createdBy: req.user?._id as Types.ObjectId,
            group_image: group_image as string,
          },
        ],
      })) || [];

    // check if group chat was created successfully
    if (!newGroup) {
      if (group_image) {
        await deleteFile({ Key: group_image });
      }
      throw new BadRequestExceptions("Failed to create group chat");
    }

    successResponse({ res, data: { newGroup } });
  };

  getGroupChat = async (req: Request, res: Response) => {
    // extract roomId from request parameters
    const { groupId } = req.params as IGetGroupChatParams;

    // find group chat by groupId and include logged-in user
    const chat = await this._chatModel.findOne({
      filter: {
        _id: Types.ObjectId.createFromHexString(groupId),
        group: { $exists: true },
        participants: { $in: [req.user?._id as Types.ObjectId] },
      },
      options: {
        populate: "messages.createdBy", // .createdBy => for get information about creator the message + the message
      },
    });

    // check if the group chat exists
    if (!chat) throw new NotFoundExceptions("failed to find group");

    // send success response with group data
    successResponse({ res, data: { chat } });
  };

  // SOCKET IO
  sayHi = ({ socket, message, callback, io }: ISayHiDTO) => {
    try {
      callback ? callback("I received your message") : undefined;
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };

  sendMessage = async ({ content, sendTo, socket, io }: IMessageDTO) => {
    try {
      const { content: validContent, sendTo: validSendTo } =
        chatMessageSchema.parse({
          content,
          sendTo,
        });
      const createdBy = socket.credentials?.user?._id as Types.ObjectId;
      const user = await this._userModel.findOne({
        filter: {
          _id: Types.ObjectId.createFromHexString(validSendTo),
          friends: { $in: [createdBy] },
        },
      });

      if (!user) throw new NotFoundExceptions("Fail to find user");

      // check if chat already exists and update it
      const chat = await this._chatModel.findOneAndUpdate({
        filter: {
          participants: {
            $all: [createdBy, Types.ObjectId.createFromHexString(validSendTo)],
          },
          group: { $exists: false },
        },
        update: {
          $addToSet: {
            messages: {
              content: validContent, // key same value
              createdBy,
            },
          },
        },
      });

      // if chat not exists create new chat
      if (!chat) {
        const [newChat] =
          (await this._chatModel.create({
            data: [
              {
                createdBy,
                messages: [{ content: validContent, createdBy }],
                participants: [
                  createdBy,
                  Types.ObjectId.createFromHexString(validSendTo),
                ],
              },
            ],
          })) || [];

        if (!newChat)
          throw new BadRequestExceptions("Fail to created new chat");
      }

      io?.emit("successMessage", { content: validContent });
      io?.emit("newMessage", {
        content: validContent,
        from: socket.credentials?.user,
      });
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };

  joinRoom = async ({ roomId, socket, io }: IJoinRoomDTO) => {
    try {
      const chat = await this._chatModel.findOne({
        filter: {
          roomId,
          participants: {
            $in: [socket.credentials?.user?._id as Types.ObjectId],
          },
          group: { $exists: true },
        },
      });

      if (!chat) throw new NotFoundExceptions("Failed to join rooms");

      socket.join(chat.roomId);
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };

  sendGroupMessage = async ({
    content,
    groupId,
    socket,
    io,
  }: ISendGroupMessageDTO) => {
    try {
      const { content: validContent } = chatGroupMessageSchema.parse({
        content,
      });
      // get ths user create message
      const createdBy = socket.credentials?.user?._id as Types.ObjectId;

      const chat = await this._chatModel.findOneAndUpdate({
        filter: {
          _id: Types.ObjectId.createFromHexString(groupId),
          participants: { $in: [createdBy as Types.ObjectId] },
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
      if (!chat) throw new BadRequestExceptions("Failed to create message");

      io?.emit("successMessage", { content: validContent });
    } catch (error) {
      socket.emit("custom_error", error);
    }
  };

  // Typing Chat OVO
  userTyping = async ({ to, socket, io }: ITypingChatDTO) => {
    try {
      const fromUser = socket.credentials?.user;
      if (!fromUser || !to) return;

      const receivers = connectedSockets.get(to);
      if (!receivers?.length) return;

      io.to(receivers).emit("userTyping", {
        from: fromUser._id,
        fullName: fromUser.fullName,
      });
    } catch (error) {
      socket.emit("custom_error", { message: "Error in userTyping", error });
    }
  };

  userStopTyping = async ({ to, socket, io }: ITypingChatDTO) => {
    try {
      const fromUser = socket.credentials?.user;
      if (!fromUser || !to) return;

      const receivers = connectedSockets.get(to);
      if (!receivers?.length) return;

      io.to(receivers).emit("userStopTyping", {
        from: fromUser._id,
      });
    } catch (error) {
      socket.emit("custom_error", {
        message: "Error in userStopTyping",
        error,
      });
    }
  };

  // Typing Group OMV
  userTypingGroup = async ({ groupId, socket, io }: ITypingGroupDTO) => {
    const fromUser = socket.credentials?.user;
    if (!fromUser || !groupId || !fromUser._id) return;

    const groupChat = await this._chatModel.findById({
      id: new Types.ObjectId(groupId),
      options: { populate: ["messages.createdBy"] },
    });

    console.log(groupChat);

    if (!groupChat) return;

    const otherParticipants = groupChat.participants.filter(
      (id: Types.ObjectId) => id.toString() !== fromUser._id?.toString()
    );

    otherParticipants.forEach((participantId: Types.ObjectId) => {
      const receivers = connectedSockets.get(participantId.toString());
      console.log("Sending typing to:", participantId.toString(), "receivers:", receivers);

      if (receivers?.length) {
        io.to(receivers).emit("userTypingGroup", {
          from: fromUser._id,
          fullName: fromUser.fullName,
        });
      }
    });
  };

  userStopTypingGroup = async ({ groupId, socket, io }: ITypingGroupDTO) => {
    const fromUser = socket.credentials?.user;
    if (!fromUser || !groupId || !fromUser._id) return;

    const groupChat = await this._chatModel.findById({
      id: new Types.ObjectId(groupId),
    });

    console.log(groupChat);
    if (!groupChat) return;

    const otherParticipants = groupChat.participants.filter(
      (id: Types.ObjectId) => id.toString() !== fromUser._id?.toString()
    );

    otherParticipants.forEach((participantId: Types.ObjectId) => {
      const receivers = connectedSockets.get(participantId.toString());
      if (receivers?.length) {
        io.to(receivers).emit("userStopTypingGroup", {
          from: fromUser._id,
          fullName: fromUser.fullName,
        });
      }
    });
  };
}

export default new ChatService();
