import type { Model } from "mongoose";
import { DataBaseRepository } from "./db.repositories";
import { IComment } from "../models/Comment.model";

export class CommentRepository extends DataBaseRepository<IComment> {
  constructor(protected override readonly model: Model<IComment>) {
    super(model);
  }
}
