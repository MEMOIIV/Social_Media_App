import z from "zod";
import { confirmEmailSchema, loginSchema, signupSchema, signupWithGmailSchema } from "./auth.validation";
import { IUser } from "../../DB/models/User.model";

export type ISignupDTO = z.infer<typeof signupSchema.body> 
export type IConfirmEmailDTO = z.infer<typeof confirmEmailSchema.body> 
export type ILoginDTO = z.infer<typeof loginSchema.body> 
export type ISignupGmail = z.infer<typeof signupWithGmailSchema.body> 

export type CreateUserDTO = Partial<
  Pick<IUser, "gender" | "role" | "phone" | "address" | "confirmEmailOTP"> // Options
> &
  Pick<IUser, "fullName" | "email" | "password">; // Required