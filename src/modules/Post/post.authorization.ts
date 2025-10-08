import { RoleEnum } from "../../DB/models/User.model";

export const endPoint = {
  createPost: [RoleEnum.user, RoleEnum.admin],
};
