import { query, param } from "express-validator";

export default [
  path("postId").isString().trim().not().isEmpty(),
  query("mini").optional().isBoolean(),
];
