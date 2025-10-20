import { RoleEnum } from "../../DB/models/User.model";

export const endPoint = {
  getChat: [RoleEnum.user, RoleEnum.admin],
};