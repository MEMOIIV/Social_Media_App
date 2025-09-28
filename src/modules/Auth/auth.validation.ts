import z from "zod";
import { generalField } from "../../middleware/validationMiddleware";

// Login
export const loginSchema = {
  body: z.strictObject({
    email: generalField.email,
    password: generalField.password,
  }),
};

// Signup
export const signupSchema = {
  body: loginSchema.body
    .extend({
      fullName: generalField.fullName,
      confirmPassword: generalField.confirmPassword,
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: "password mismatch",
        });
      }
    }),
};

// Confirm Email 
export const confirmEmailSchema = {
  body: z.strictObject({
    email: generalField.email,
    otp: generalField.otp,
  }),
};
