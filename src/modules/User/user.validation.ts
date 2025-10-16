import z from "zod";
import { LogoutEnum } from "../../DB/models/User.model";
import { generalField } from "../../middleware/validationMiddleware";

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

export const sendFriendRequestSchema = {
    params : z.strictObject({
        userId : generalField.id
    })
}

export const acceptFriendRequestSchema = {
    params : z.strictObject({
        requestId : generalField.id
    })
}
// export const fileSchema