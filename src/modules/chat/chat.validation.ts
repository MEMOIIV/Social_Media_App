import z from "zod";
import { generalField } from "../../middleware/validationMiddleware";

export const chatSchema = {
  params: z.strictObject({
    userId: generalField.id,
  }),
};
