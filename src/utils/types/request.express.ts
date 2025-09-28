import { JwtPayload } from "jsonwebtoken";
import { HUserModel } from "../../DB/models/User.model";

declare module "express-serve-static-core"  {
    interface Request {
        user?:HUserModel;
        decoded?:JwtPayload
    }
}