import { hash, compare } from "bcrypt";

export const generateHash = async (
  plaintext: string,
  saltRound: number = Number(process.env.SALT_ROUND as string)
): Promise<string> => {
  return await hash(plaintext, saltRound);
};

export const comparHash = async (
  plaintext: string,
  hashValue: string,
): Promise<boolean> => {
  return await compare(plaintext, hashValue);
};
