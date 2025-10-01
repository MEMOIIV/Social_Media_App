import { Router } from "express";
import authService from "./auth.service";
import { validation } from "../../middleware/validationMiddleware";
import {
  confirmEmailSchema,
  loginSchema,
  signupSchema,
  signupWithGmailSchema,
} from "./auth.validation";
const router: Router = Router();

router.post(
  "/signup-gmail",
  validation(signupWithGmailSchema),
  authService.signupWithGmail
);
router.post(
  "/login-gmail",
  validation(signupWithGmailSchema),
  authService.loginWithGmail
);

router.post("/signup", validation(signupSchema), authService.signup);
router.patch(
  "/confirmEmail",
  validation(confirmEmailSchema),
  authService.confirmEmail
);

router.post("/login", validation(loginSchema), authService.login);

export default router;
