import { Router } from "express";
import userService from "./user.service";
import { authentication } from "../../middleware/authentication.middleware";
import { endPoint } from "./user.authorization";
import { validation } from "../../middleware/validationMiddleware";
import { TokenEnum } from "../../utils/security/token.utils";
import {
  cloudFileUpload,
  fileValidation,
  StorageEnum,
} from "../../utils/multer/cloud.multer";
import * as validators from './user.validation'
const router: Router = Router();
router.get(
  "/profile",
  authentication(endPoint.profile),
  userService.getProfile
);
router.post(
  "/logout",
  validation(validators.logoutSchema),
  authentication(endPoint.logout),
  userService.logout
);

router.post(
  "/refresh-token",
  authentication(endPoint.refreshToken, TokenEnum.refresh),
  userService.refreshToken
);

router.patch(
  "/profile-image",
  authentication(endPoint.profileImage),
  cloudFileUpload({
    storageApproach: StorageEnum.memory,
    validation: [...fileValidation.images],
    // maxsize: 3,
  }).single("attachment"),
  userService.profileImage
);

router.patch(
  "/profile-cover-image",
  authentication(endPoint.profileImage),
  cloudFileUpload({
    storageApproach: StorageEnum.disk,
    validation: [...fileValidation.images],
    maxsize: 3,
  }).array("attachments" , 5),
  userService.profileCoverImage
);

// Friend Request
router.post(
  "/:userId/friend-request",
  authentication(endPoint.friendRequest),
  validation(validators.sendFriendRequestSchema),
  userService.friendRequest
);

// Accept Friend Request 
router.patch(
  "/:requestId/accept-friend-request",
  authentication(endPoint.acceptRequest),
  validation(validators.acceptFriendRequestSchema),
  userService.acceptRequest
);
export default router;
