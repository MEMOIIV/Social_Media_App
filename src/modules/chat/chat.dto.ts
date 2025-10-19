import { IAuthSocket } from "../gateway/gateway.dto";

export interface ISayHiDTO {
  socket: IAuthSocket;
  message: string;
  callback: any;
}
