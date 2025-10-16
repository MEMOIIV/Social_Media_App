import { RoleEnum } from "../../DB/models/User.model";

export const endPoint = {
  profile: [RoleEnum.user, RoleEnum.admin],
  logout: [RoleEnum.user, RoleEnum.admin],
  refreshToken: [RoleEnum.user, RoleEnum.admin],
  profileImage: [RoleEnum.user, RoleEnum.admin],
  friendRequest: [RoleEnum.user, RoleEnum.admin],
  acceptRequest: [RoleEnum.user, RoleEnum.admin],
};
