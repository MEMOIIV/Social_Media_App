import type { Model } from "mongoose";
import { DataBaseRepository } from "./db.repositories";
import { IFriendRequest } from "../models/friendRequest.model";

export class FriendRepository extends DataBaseRepository<IFriendRequest> {
  constructor(protected override readonly model: Model<IFriendRequest>) {
    super(model);
  }
}
