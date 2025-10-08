import type { Model } from "mongoose";
import { DataBaseRepository } from "./db.repositories";

import { IPost } from "../models/Post.model";

export class PostRepository extends DataBaseRepository<IPost> {
  constructor(protected override readonly model: Model<IPost>) {
    super(model);
  }
}
