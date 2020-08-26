import { Request, Response } from "express";
import {
  GetPostQuery,
  GetPostPath,
  GetPostResponse200,
} from "./GetPost.interfaces";
import { UserLeanDocument } from "persistance/User/User.interfaces";

export default async (req: Request, res: Response<GetPostResponse200>) => {
  const user = req.user! as UserLeanDocument;
  const query = req.query as GetPostQuery;
  const param = (req.params as unknown) as GetPostPath;
  return res.send();
};
