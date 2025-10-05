import z from "zod";
import { LogoutEnum } from "../../DB/models/User.model";

export const logoutSchema = {
    body:z.strictObject({
        flag:z.enum(LogoutEnum).default(LogoutEnum.only)
    })
}

// export const fileSchema