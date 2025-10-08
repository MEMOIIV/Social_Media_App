import { Router } from "express";
import postService from "./post.service";
import { authentication } from "../../middleware/authentication.middleware";
import { endPoint } from "./post.authorization"; // access role
const router: Router = Router();

router.post(
  "/create-post",
  authentication(endPoint.createPost),
  postService.createPost
);

export default router;
