import z from "zod";
import { logoutSchema, PresignedURL } from "./user.validation";

export type ILogoutDTO = z.infer<typeof logoutSchema.body> 
export type IPresignedURL = z.infer<typeof PresignedURL.body> 
