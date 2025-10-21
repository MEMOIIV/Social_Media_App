import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import { endPoint } from "./chat.authorization";
import { validation } from "../../middleware/validationMiddleware";
import * as validators from "./chat.validation";
import chatService from "./chat.service";
import {
  cloudFileUpload,
  fileValidation,
} from "../../utils/multer/cloud.multer";

const router: Router = Router({
  mergeParams: true,
});

// get Chat
router.get(
  "/",
  authentication(endPoint.getChat),
  validation(validators.chatSchema),
  chatService.getChat
);

// Create group
router.post(
  "/create-group",
  authentication(endPoint.createGroupChat),
  cloudFileUpload({ validation: [...fileValidation.images] }).single(
    "attachment"
  ),
  validation(validators.groupChatSchema),
  chatService.createGroupChat
);

// Get group chat
router.get(
  "/group/:groupId",
  authentication(endPoint.GetGroupChat),
  validation(validators.getGroupChatSchema),
  chatService.getGroupChat
);
export default router;
