import z from 'zod'
import { getPostsSchema, likeAndUnlikePostSchema, updatePostSchema } from './post.validation'

export type likePostQueryDTO = z.infer<typeof likeAndUnlikePostSchema.query>
export type updatePostParamsDto = z.infer<typeof updatePostSchema.params>