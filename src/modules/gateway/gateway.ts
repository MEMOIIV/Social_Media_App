import { Server as httpServer } from "node:http";
import { ExtendedError, Server } from "socket.io";
import { decodeToken } from "../../utils/security/token.utils";
import { IAuthSocket } from "./gateway.dto";
import chalk from "chalk";

// connected with socket
export const initialize = (httpServer: httpServer) => {
  // setup Socket.IO server to handle client connections
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // Event (socket.to.emit) => send event to all clients except the current one
  const connectedSockets = new Map<string, string[]>(); // value be string To assemble socket.id for multi tabs

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
      let remainingTabs =
        connectedSockets.get(userId)?.filter((tab) => {
          return tab !== socket.id;
        }) || [];
      if (remainingTabs.length) {
        connectedSockets.set(userId, remainingTabs);
      } else {
        connectedSockets.delete(userId);
      }
      console.log(
        chalk.black.bgRed(
          `Logout from ::: ${JSON.stringify([...connectedSockets])}`
        ) // => [ userId, [ socketId1, socketId2, ... ] ]
      );
    });
  }

  // Connection io
  io.on("connection", (socket: IAuthSocket) => {
    console.log(chalk.black.bgMagentaBright(`User Channel: ${socket.id}`));
    console.log(connectedSockets);
    
    // Disconnection io running
    disconnection(socket);
  });
};
