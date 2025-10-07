import z from "zod";
import { LogoutEnum } from "../../DB/models/User.model";

export const logoutSchema = {
    body:z.strictObject({
        flag:z.enum(LogoutEnum).default(LogoutEnum.only)
    })
}

export const PresignedURL = {
    body:z.strictObject({
        ContentType: z.string(),
        Originalname: z.string(),
    })
}

// export const fileSchema