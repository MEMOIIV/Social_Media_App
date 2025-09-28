import { CreateOptions, HydratedDocument, Model } from "mongoose";
import { IUser } from "../models/User.model";
import { DataBaseRepository } from "./db.repositories";
import { BadRequestExceptions } from "../../utils/response/err.response";
import { CreateUserDTO } from "../../modules/Auth/auth.dto";


export class UserRepository extends DataBaseRepository<IUser> {
  constructor(protected override readonly model: Model<IUser>) {
    super(model);
  }

  async createUser({
    data,
    options,
  }: {
    data: CreateUserDTO[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<IUser>> {
    const [user] = (await this.create({ data, options })) || [];
    if (!user)
      throw new BadRequestExceptions("fail to created user", {
        cause: { data, options },
      });
    return user;
  }
}
