import { Server as httpServer } from "node:http";
import { ExtendedError, Server } from "socket.io";
import { decodeToken } from "../../utils/security/token.utils";
import { IAuthSocket } from "./gateway.dto";
import chalk from "chalk";
import { ChatGateway } from "../chat/chat.gateway";

let io: Server | null = null;

// Event (socket.to.emit) => send event to all clients except the current one
export const connectedSockets = new Map<string, string[]>(); // value be string To assemble socket.id for multi tabs

// connected with socket
export const initialize = (httpServer: httpServer) => {
  // setup Socket.IO server to handle client connections
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // Middleware Socket io
  io.use(async (socket: IAuthSocket, next: (err?: ExtendedError) => void) => {
    // Error handling with try and catch
    try {
      const token = socket.handshake?.auth.authorization || "";
      const { user, decoded } = await decodeToken({ authorization: token });

      // multi tabs
      const userTabs = connectedSockets.get(user._id.toString()) || []; // get all tabs
      userTabs?.push(socket.id);
      connectedSockets.set(user._id.toString(), userTabs);

      // set credentials in IAuthSockets for make it shear
      socket.credentials = { user, decoded };
      next();
    } catch (error: any) {
      next(error);
    }
  });

  // Disconnection io function
  function disconnection(socket: IAuthSocket) {
    socket.on("disconnect", () => {
      // multi tabs
      const userId = socket.credentials?.user._id?.toString() as string;
      if (!userId) return;
      let remainingTabs =
        connectedSockets.get(userId)?.filter((tab) => {
          return tab !== socket.id;
        }) || [];
      if (remainingTabs.length) {
        connectedSockets.set(userId, remainingTabs);
      } else {
        // Remove user from connected sockets and notify others that the user went offline
        connectedSockets.delete(userId);
        socket.broadcast.emit("userStatusChanged", { userId, online: false });
      }
      console.log(
        chalk.black.bgRed(
          `Logout from ::: ${JSON.stringify([...connectedSockets])}`
        ) // => [ userId, [ socketId1, socketId2, ... ] ]
      );
    });
  }

  // Connection ChatGateway
  const chatGateway: ChatGateway = new ChatGateway();
  // Connection io
  io.on("connection", (socket: IAuthSocket) => {
    const userId = socket.credentials?.user?._id?.toString();
    if (!userId) return;
    console.log(chalk.black.bgMagentaBright(`User Connected: ${userId}`));
    console.log(connectedSockets);

    // Add user
    const tabs = connectedSockets.get(userId) || [];
    connectedSockets.set(userId, [...tabs, socket.id]);

    // Broadcast to others that user came online
    socket.broadcast.emit("userStatusChanged", { userId, online: true });

    // Send the newly connected user a list of all online users
    const onlineUsers = [...connectedSockets.keys()].filter(
      (id) => id !== userId
    );
    socket.emit("onlineUsersList", onlineUsers);

    // connected chatGateway
    chatGateway.register(socket, getIo());

    // disconnect handler
    disconnection(socket);
  });
};

export const getIo = (): Server => {
  if (!io) throw new Error("socket io not initialized");
  return io;
};
