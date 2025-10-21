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

  typing = (socket: IAuthSocket, io: Server) => {
    // المستخدم بدأ يكتب
    socket.on("typing", (data: { to: string }) => {
      this._chatService.userTyping({ ...data, socket, io });
    });

    // المستخدم وقف كتابة
    socket.on("stopTyping", (data: { to: string }) => {
      this._chatService.userStopTyping({ ...data, socket, io });
    });
  };

  typingGroup = (socket: IAuthSocket, io: Server) => {
    socket.on("typingGroup", (data: { groupId: string }) => {
      console.log("New socket connected:", socket.id);

      this._chatService.userTypingGroup({ ...data, socket, io });
    });

    socket.on("stopTypingGroup", (data: { groupId: string }) => {
      this._chatService.userStopTypingGroup({ ...data, socket, io });
    });
  };
}
