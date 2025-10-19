"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ChatService {
    constructor() { }
    sayHi = ({ socket, message, callback }) => {
        try {
            console.log(message);
            callback ? callback("I received your message") : undefined;
        }
        catch (error) {
            socket.emit("custom_error", error);
        }
    };
}
exports.default = new ChatService();
