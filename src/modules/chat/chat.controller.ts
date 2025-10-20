import { Router } from "express";
import { authentication } from "../../middleware/authentication.middleware";
import { endPoint } from "./chat.authorization";
import { validation } from "../../middleware/validationMiddleware";
import * as validators from "./chat.validation";
import chatService from "./chat.service";

const router: Router = Router({
  mergeParams: true,
});

router.get(
  "/",
  authentication(endPoint.getChat),
  validation(validators.chatSchema),
  chatService.getChat
);

export default router;
