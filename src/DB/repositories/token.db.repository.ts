import { Model } from "mongoose";
import { DataBaseRepository } from "./db.repositories";
import { IToken } from "../models/token.model";



export class TokenRepository extends DataBaseRepository<IToken> {
  constructor(protected override readonly model: Model<IToken>) {
    super(model);
  }

  

}
