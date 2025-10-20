import type { Model } from "mongoose";
import { DataBaseRepository } from "./db.repositories";
import { IChat } from "../models/Chat.model";

export class ChatRepository extends DataBaseRepository<IChat> {
  constructor(protected override readonly model: Model<IChat>) {
    super(model);
  }
}