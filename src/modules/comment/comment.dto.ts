import z from "zod";
import { crateCommentSchema, crateReplaySchema } from "./comment.validation";



export type ICommentParamsDTO = z.infer<typeof crateCommentSchema.params> 
export type IReplayParamsDTO = z.infer<typeof crateReplaySchema.params> 
