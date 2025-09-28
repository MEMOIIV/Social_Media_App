import { Router } from "express";
import userService from "./user.service";
import { authentication } from "../../middleware/authentication.middleware";
import { endPoint } from "./user.authorization";
import { validation } from "../../middleware/validationMiddleware";
import { logoutSchema } from "./user.validation";
import { TokenEnum } from "../../utils/security/token.utils";
const router: Router = Router();
router.get(
  "/profile",
  authentication(endPoint.profile),
  userService.getProfile
);
router.post(
  "/logout",
  validation(logoutSchema),
  authentication(endPoint.logout),
  userService.logout
);

router.post(
  "/refresh-token",
  authentication(endPoint.refreshToken , TokenEnum.refresh),
  userService.refreshToken
);
export default router;
 