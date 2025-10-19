import { Socket } from "socket.io";
import { HUserModelDocument } from "../../DB/models/User.model";
import { JwtPayload } from "jsonwebtoken";

// Extend Socket and add features
export interface IAuthSocket extends Socket {
  credentials?: {
    user: Partial<HUserModelDocument>;
    decoded: JwtPayload;
  };
}