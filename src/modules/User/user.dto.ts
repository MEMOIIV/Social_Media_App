import z from "zod";
import { acceptFriendRequestSchema, logoutSchema, PresignedURL, sendFriendRequestSchema } from "./user.validation";

export type ILogoutDTO = z.infer<typeof logoutSchema.body> 
export type IPresignedURL = z.infer<typeof PresignedURL.body> 
export type IFriendParams = z.infer<typeof sendFriendRequestSchema.params> 
export type IAcceptParams = z.infer<typeof acceptFriendRequestSchema.params> 
