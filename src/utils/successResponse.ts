import { Response } from "express";

const successResponse = ({
  res,
  message = "success",
  statusCode = 200,
  data,
}: {
  res: Response;
  message?: string;
  statusCode?: number;
  data?:object | null
}) => {
  return res.status(statusCode).json({ message, data });
};
export default successResponse;
