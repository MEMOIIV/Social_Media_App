import z from "zod";
import { IAuthSocket } from "../gateway/gateway.dto";
import {
  chatSchema,
  getGroupChatSchema,
  groupChatSchema,
} from "./chat.validation";
import { Server } from "socket.io";

export interface ISayHiDTO {
  socket: IAuthSocket;
  message: string;
  callback: any;
  io: Server;
}
export interface IMessageDTO {
  socket: IAuthSocket;
  content: string;
  sendTo: string;
  io: Server;
}
export interface IJoinRoomDTO {
  socket: IAuthSocket;
  io: Server;
  roomId: string;
}
export interface ISendGroupMessageDTO {
  socket: IAuthSocket;
  io: Server;
  content : string;
  groupId : string;
}

export type IGwtChatParams = z.infer<typeof chatSchema.params>;
export type ICreateGroupChatBody = z.infer<typeof groupChatSchema.body>;
export type IGetGroupChatParams = z.infer<typeof getGroupChatSchema.params>;
