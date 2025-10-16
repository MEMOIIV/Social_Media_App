import { JwtPayload, Secret, sign, SignOptions, verify } from "jsonwebtoken";
import { HUserModelDocument, RoleEnum, UserModel } from "../../DB/models/User.model";
import {
  BadRequestExceptions,
  NotFoundExceptions,
  UnAuthorizedExceptions,
} from "../response/err.response";
import { UserRepository } from "../../DB/repositories/user.db.repository";
import { v4 as uuidv4 } from "uuid";
import { TokenModel } from "../../DB/models/token.model";
import { TokenRepository } from "../../DB/repositories/token.db.repository";

export const generateToken = async ({
  payload,
  secretKey = process.env.ACCESS_USER_SIGNATURE as string,
  options = { expiresIn: Number(process.env.ACCESS_EXPIRES_IN) },
}: {
  payload: object;
  secretKey?: Secret;
  options?: SignOptions;
}): Promise<string> => {
  return await sign(payload, secretKey, options);
};

export const verifyToken = async ({
  token,
  secretKey = process.env.ACCESS_USER_SIGNATURE as string,
}: {
  token: string;
  secretKey?: Secret;
}): Promise<JwtPayload> => {
  return (await verify(token, secretKey)) as JwtPayload;
};

export enum TokenEnum {
  access = "Access",
  refresh = "Refresh",
}

// 3
export const getSignatureLevel = async (role: RoleEnum = RoleEnum.user) => {
  let signatureLevel: RoleEnum = RoleEnum.user;
  switch (role) {
    case RoleEnum.admin:
      signatureLevel = RoleEnum.admin;
      break;
    case RoleEnum.user:
      signatureLevel = RoleEnum.user;
      break;
    default:
      break;
  }
  return signatureLevel;
};

// 4
export const getSignature = async (
  signatureLevel: RoleEnum = RoleEnum.user
) => {
  let signatures: { access_signature: string; refresh_signature: string } = {
    access_signature: "",
    refresh_signature: "",
  };
  switch (signatureLevel) {
    case RoleEnum.admin:
      signatures.access_signature = process.env
        .ACCESS_ADMIN_SIGNATURE as string;
      signatures.refresh_signature = process.env
        .REFRESH_ADMIN_SIGNATURE as string;
      break;
    case RoleEnum.user:
      signatures.access_signature = process.env.ACCESS_USER_SIGNATURE as string;
      signatures.refresh_signature = process.env
        .REFRESH_USER_SIGNATURE as string;
      break;
    default:
      break;
  }
  return signatures;
};

// 1
export const createLoginCredentials = async (user: HUserModelDocument) => {
  const jwtid = uuidv4();
  // 5
  const signatureLevel = await getSignatureLevel(user.role);

  const signature = await getSignature(signatureLevel);

  // 1
  const accessToken = await generateToken({
    payload: { _id: user._id, email: user.email, name: user.firstName },
    secretKey: signature.access_signature,
    options: { expiresIn: Number(process.env.ACCESS_EXPIRES_IN), jwtid },
  });

  const refreshToken = await generateToken({
    payload: { _id: user._id, email: user.email, name: user.firstName },
    secretKey: signature.refresh_signature,
    options: { expiresIn: Number(process.env.REFRESH_EXPIRES_IN), jwtid },
  });

  return { accessToken, refreshToken };
};
// decoded token  => get token , verify token get user get payload check jti and changeCredentialsTime and return user and decoded
export const decodeToken = async ({
  authorization,
  tokenType = TokenEnum.access,
}: {
  authorization: string;
  tokenType?: TokenEnum;
}) => {
  // get UserModel
  const userModel = new UserRepository(UserModel);
  const tokenModel = new TokenRepository(TokenModel);

  const [bearer, token] = authorization.split(" ");
  // Destructuring from Authorization
  if (!bearer || !token)
    throw new UnAuthorizedExceptions("Missing Token Parts ");

  // get Signature
  const signature = await getSignature(bearer as RoleEnum);

  // verify token
  const decoded = await verifyToken({
    token,
    secretKey:
      tokenType === TokenEnum.refresh
        ? signature.refresh_signature
        : signature.access_signature,
  });

  if (!decoded?._id || !decoded?.iat)
    throw new UnAuthorizedExceptions("In-valid token payload");

  // check jti with only device
  if (await tokenModel.findOne({ filter: { jti: decoded.jti } }))
    throw new UnAuthorizedExceptions("In-valid or old login credentials");

  // get user
  const user = await userModel.findOne({
    filter: { _id: decoded._id },
  });

  if (!user) throw new NotFoundExceptions("Not register account");

  // check changeCredentialsTime with all devices
  if (user.changeCredentialsTime?.getTime() || 0 > decoded.iat * 1000)
    throw new UnAuthorizedExceptions("In-valid or old login credentials");

  return { user, decoded };
};

// Revoke Token
export const revokeToken = async (decoded: JwtPayload) => {
  const tokenModel = new TokenRepository(TokenModel);
  const [results] =
    (await tokenModel.create({
      data: [
        {
          jti: decoded?.jti as string,
          expiresIn:
            (decoded?.iat as number) + Number(process.env.REFRESH_EXPIRES_IN),
          userId: decoded?._id,
        },
      ],
      options: { validateBeforeSave: true },
    })) || [];

  if (!results) throw new BadRequestExceptions("Failed to revoke token ");

  return results;
};
