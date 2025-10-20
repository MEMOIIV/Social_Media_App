import type { Model } from "mongoose";
import { DataBaseRepository } from "./db.repositories";
import { IMessages } from "../models/Chat.model";

export class MessageRepository extends DataBaseRepository<IMessages> {
  constructor(protected override readonly model: Model<IMessages>) {
    super(model);
  }
}