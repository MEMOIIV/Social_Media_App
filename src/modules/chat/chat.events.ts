import { IAuthSocket } from "../gateway/gateway.dto";
import ChatService  from "./chat.service";

export class ChatEvents {
    private _chatService = ChatService
  constructor() {}

  sayHi = (socket: IAuthSocket) => { 
    return socket.on("sayHi", (message , callback) => { // socket io 
        this._chatService.sayHi({socket , message , callback}) // service
    });
  };
}
