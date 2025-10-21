import { RoleEnum } from "../../DB/models/User.model";

export const endPoint = {
  getChat: [RoleEnum.user, RoleEnum.admin],
  createGroupChat: [RoleEnum.user, RoleEnum.admin],
  GetGroupChat: [RoleEnum.user, RoleEnum.admin],
};