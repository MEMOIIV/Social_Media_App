"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.initialize = exports.connectedSockets = void 0;
const socket_io_1 = require("socket.io");
const token_utils_1 = require("../../utils/security/token.utils");
const chalk_1 = __importDefault(require("chalk"));
const chat_gateway_1 = require("../chat/chat.gateway");
let io = null;
exports.connectedSockets = new Map();
const initialize = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
        },
    });
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake?.auth.authorization || "";
            const { user, decoded } = await (0, token_utils_1.decodeToken)({ authorization: token });
            const userTabs = exports.connectedSockets.get(user._id.toString()) || [];
            userTabs?.push(socket.id);
            exports.connectedSockets.set(user._id.toString(), userTabs);
            socket.credentials = { user, decoded };
            next();
        }
        catch (error) {
            next(error);
        }
    });
    function disconnection(socket) {
        socket.on("disconnect", () => {
            const userId = socket.credentials?.user._id?.toString();
            if (!userId)
                return;
            let remainingTabs = exports.connectedSockets.get(userId)?.filter((tab) => {
                return tab !== socket.id;
            }) || [];
            if (remainingTabs.length) {
                exports.connectedSockets.set(userId, remainingTabs);
            }
            else {
                exports.connectedSockets.delete(userId);
                socket.broadcast.emit("userStatusChanged", { userId, online: false });
            }
            console.log(chalk_1.default.black.bgRed(`Logout from ::: ${JSON.stringify([...exports.connectedSockets])}`));
        });
    }
    const chatGateway = new chat_gateway_1.ChatGateway();
    io.on("connection", (socket) => {
        const userId = socket.credentials?.user?._id?.toString();
        if (!userId)
            return;
        console.log(chalk_1.default.black.bgMagentaBright(`User Connected: ${userId}`));
        console.log(exports.connectedSockets);
        const tabs = exports.connectedSockets.get(userId) || [];
        exports.connectedSockets.set(userId, [...tabs, socket.id]);
        socket.broadcast.emit("userStatusChanged", { userId, online: true });
        const onlineUsers = [...exports.connectedSockets.keys()].filter((id) => id !== userId);
        socket.emit("onlineUsersList", onlineUsers);
        chatGateway.register(socket, (0, exports.getIo)());
        disconnection(socket);
    });
};
exports.initialize = initialize;
const getIo = () => {
    if (!io)
        throw new Error("socket io not initialized");
    return io;
};
exports.getIo = getIo;
