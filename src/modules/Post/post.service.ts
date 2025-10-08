import type { Request, Response } from "express";
import successResponse from "../../utils/successResponse";
import { PostModel } from "../../DB/models/Post.model";
import { PostRepository } from "../../DB/repositories/post.db.repository";
import { UserRepository } from "../../DB/repositories/user.db.repository";
import { UserModel } from "../../DB/models/User.model";

class PostService {
  private _postModel = new PostRepository(PostModel);
  private _userModel = new UserRepository(UserModel);

  constructor() {}

  createPost = async (req: Request, res: Response) => {
    return successResponse({
      res,
      message: "Post created successfully",
      statusCode: 201,
    });
  };
}

export default new PostService();
