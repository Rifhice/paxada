import checkValidator from "middlewares/checkValidator";
import route from "./GetPost.route";
import validator from "./GetPost.validator";
import { sanityzeQuery } from "middlewares/sanitize";
import wrapAsync from "helpers/wrapAsync";
import routeId from "middlewares/routeId";

export default [
  routeId(1),
  checkValidator(validator),
  sanityzeQuery(["mini"]),
  wrapAsync(route),
];
