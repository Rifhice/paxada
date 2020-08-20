import { Route } from "mentine";

const doc: Route = {
  simplified: true,
  path: "/api/user/:id/blacklist",
  method: "put",
  tag: "User",
  summary: "lalalla",
  description: "lelelel",
  pathVariables: {
    id: {
      type: "string",
      description: "Id of user",
      example: "3",
      required: true,
    },
  },
  queryVariables: {
    start: {
      type: "integer",
      description: "Paging start",
      required: true,
      example: 20,
    },
  },
  body: {
    blacklist: {
      type: "boolean",
      description: "blacklisted",
      example: true,
      required: true,
    },
  },
  responses: {
    204: {
      description: "Salut",
    },
  },
};

describe("getTypescriptInterfaces", () => {
  test("", () => {});
});
