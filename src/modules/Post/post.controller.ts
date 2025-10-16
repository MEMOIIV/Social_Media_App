import { Router } from "express";
import postService from "./post.service";
import { authentication } from "../../middleware/authentication.middleware";
import { endPoint } from "./post.authorization"; // access role
import {
  cloudFileUpload,
  fileValidation,
} from "../../utils/multer/cloud.multer";
import * as validator from "./post.validation";
import { validation } from "../../middleware/validationMiddleware";
import commentRouter from "../comment/comment.controller";
const router: Router = Router();

// Nested comment routes (handle comments for a specific post)
router.use("/:postId/comment", commentRouter);

// Post routes (create, update, like, and fetch posts)
router.post(
  "/create-post",
  authentication(endPoint.createPost),
  cloudFileUpload({ validation: fileValidation.images }).array(
    "attachments",
    3
  ),
  validation(validator.cratePostSchema),
  postService.createPost
);

router.patch(
  "/:postId/like",
  authentication(endPoint.likeAndUnlikePost),
  validation(validator.likeAndUnlikePostSchema),
  postService.likeAndUnlikePost
);

router.patch(
  "/update/:postId",
  authentication(endPoint.updatePost),
  cloudFileUpload({ validation: fileValidation.images }).array(
    "attachments",
    3
  ),
  validation(validator.updatePostSchema),
  postService.updatePost
);

router.get(
  "/",
  authentication(endPoint.getPosts),
  validation(validator.getPostsSchema),
  postService.getPosts
);

export default router;
