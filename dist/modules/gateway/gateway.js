"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = void 0;
const socket_io_1 = require("socket.io");
const token_utils_1 = require("../../utils/security/token.utils");
const chalk_1 = __importDefault(require("chalk"));
const initialize = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
        },
    });
    const connectedSockets = new Map();
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake?.auth.authorization || "";
            const { user, decoded } = await (0, token_utils_1.decodeToken)({ authorization: token });
            const userTabs = connectedSockets.get(user._id.toString()) || [];
            userTabs?.push(socket.id);
            connectedSockets.set(user._id.toString(), userTabs);
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
            let remainingTabs = connectedSockets.get(userId)?.filter((tab) => {
                return tab !== socket.id;
            }) || [];
            if (remainingTabs.length) {
                connectedSockets.set(userId, remainingTabs);
            }
            else {
                connectedSockets.delete(userId);
            }
            console.log(chalk_1.default.black.bgRed(`Logout from ::: ${JSON.stringify([...connectedSockets])}`));
        });
    }
    io.on("connection", (socket) => {
        console.log(chalk_1.default.black.bgMagentaBright(`User Channel: ${socket.id}`));
        console.log(connectedSockets);
        disconnection(socket);
    });
};
exports.initialize = initialize;
