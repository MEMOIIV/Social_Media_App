import { Router } from "express";
import commentService from "./comment.service";
import { validation } from "../../middleware/validationMiddleware";
import { authentication } from "../../middleware/authentication.middleware";
import { endPoint } from "./comment.authorization";
import {
  cloudFileUpload,
  fileValidation,
} from "../../utils/multer/cloud.multer";
import * as validator from "./comment.validation";

const router: Router = Router({
  mergeParams: true,
});

router.post(
  "/create-comment",
  authentication(endPoint.createComment),
  cloudFileUpload({ validation: fileValidation.images }).array(
    "attachments",
    3
  ),
  validation(validator.crateCommentSchema),
  commentService.createComment
);

// Create Replay
router.post(
  "/:commentId/replay-comment",
  authentication(endPoint.replayComment),
  cloudFileUpload({ validation: fileValidation.images }).array(
    "attachments",
    3
  ),
  validation(validator.crateReplaySchema),
  commentService.createReplay
);

export default router;
