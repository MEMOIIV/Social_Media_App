import { IAuthSocket } from "../gateway/gateway.dto";
import ChatService from "./chat.service";
import { Server } from "socket.io";

export class ChatEvents {
  private _chatService = ChatService;
  constructor() {}

  sayHi = (socket: IAuthSocket, io: Server) => {
    return socket.on("sayHi", (message, callback) => {
      // socket io
      this._chatService.sayHi({ socket, message, callback, io }); // service
    });
  };

  sendMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      "sendMessage",
      (data: { content: string; sendTo: string }) => {
        this._chatService.sendMessage({ ...data, socket, io });
      }
    );
  };

  joinRoom = (socket: IAuthSocket, io: Server) => {
    return socket.on("join_room", (data: { roomId: string }) => {
      this._chatService.joinRoom({ ...data, socket, io });
    });
  };

  sendGroupMessage = (socket: IAuthSocket, io: Server) => {
    return socket.on(
      "sendGroupMessage",
      (data: { content: string; groupId: string }) => {
        this._chatService.sendGroupMessage({ ...data, socket, io });
      }
    );
  };
}
