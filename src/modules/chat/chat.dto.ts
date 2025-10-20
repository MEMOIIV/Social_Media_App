import z from "zod";
import { IAuthSocket } from "../gateway/gateway.dto";
import { chatSchema } from "./chat.validation";
import {  Server } from "socket.io";


export interface ISayHiDTO {
  socket: IAuthSocket;
  message: string;
  callback: any;
  io:Server
}
export interface IMessageDTO {
  socket: IAuthSocket;
  content: string;
  sendTo:string
  io:Server

}

export type IGwtChatParams = z.infer<typeof chatSchema.params>