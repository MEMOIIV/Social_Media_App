import z from "zod";
import { logoutSchema } from "./user.validation";

export type ILogoutDTO = z.infer<typeof logoutSchema.body> 
