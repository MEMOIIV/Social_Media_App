import { RoleEnum } from "../../DB/models/User.model";

export const endPoint = {
  createComment: [RoleEnum.user, RoleEnum.admin],
  replayComment: [RoleEnum.user, RoleEnum.admin],
};
