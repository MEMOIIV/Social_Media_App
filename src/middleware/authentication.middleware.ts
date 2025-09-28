import { NextFunction, Request, Response } from "express";
import { BadRequestExceptions, ForbiddenExceptions } from "../utils/response/err.response";
import { decodeToken, TokenEnum } from "../utils/security/token.utils";
import { RoleEnum } from "../DB/models/User.model";

export const authentication = (
  accessRole: RoleEnum[] = [],
  tokenType: TokenEnum = TokenEnum.access
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization)
      throw new BadRequestExceptions("Missing Authorization");

    const { decoded, user } = await decodeToken({
      authorization: req.headers.authorization,
      tokenType
    });

    if(!accessRole.includes(user.role))
      throw new ForbiddenExceptions("You are not authorized to access this route")

    req.user = user;
    req.decoded = decoded;

    next();
  };
};
