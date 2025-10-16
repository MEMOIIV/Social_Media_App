import { RoleEnum } from "../../DB/models/User.model";

export const endPoint = {
  createPost: [RoleEnum.user, RoleEnum.admin],
  likeAndUnlikePost: [RoleEnum.user, RoleEnum.admin],
  updatePost: [RoleEnum.user, RoleEnum.admin],
  getPosts: [RoleEnum.user, RoleEnum.admin],
};
