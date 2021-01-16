import * as fs from "fs-extra";
import * as helpers from "../helpers";

describe("buildFolderStructureFromPath", () => {
  test("Should ignore the ids", () => {
    expect(helpers.buildFolderStructureFromPath("/posts/:postId")).toEqual(
      "Posts"
    );
  });
  test("Should work even with the first character not being a /", () => {
    expect(helpers.buildFolderStructureFromPath("posts/:postId")).toEqual(
      "Posts"
    );
  });
  test("Nested paths", () => {
    expect(
      helpers.buildFolderStructureFromPath("posts/:postId/comments")
    ).toEqual("Posts/Comments");
    expect(
      helpers.buildFolderStructureFromPath("posts/:postId/comments/:commentId")
    ).toEqual("Posts/Comments");
    expect(
      helpers.buildFolderStructureFromPath(
        "posts/:postId/comments/:commentId/entities"
      )
    ).toEqual("Posts/Comments/Entities");
    expect(
      helpers.buildFolderStructureFromPath(
        "posts/:postId/comments/:commentId/entities/:entity"
      )
    ).toEqual("Posts/Comments/Entities");
  });
  test("Should work even with two consecutive /", () => {
    expect(helpers.buildFolderStructureFromPath("posts//:postId")).toEqual(
      "Posts"
    );
    expect(
      helpers.buildFolderStructureFromPath(
        "posts//:postId//Comments/:commentId"
      )
    ).toEqual("Posts/Comments");
  });
});

describe("nameRoute", () => {
  test("Path with pair number of components should be name correctly in PascalCase", () => {
    expect(helpers.nameRoute("/posts/:postId", "get")).toEqual("GetPost");
    expect(helpers.nameRoute("/posts", "get")).toEqual("GetPosts");
    expect(helpers.nameRoute("/posts", "post")).toEqual("CreatePost");
    expect(helpers.nameRoute("Atchoum", "post")).toEqual("CreateAtchoum");
    expect(helpers.nameRoute("/posts/:postId", "delete")).toEqual("DeletePost");
    expect(helpers.nameRoute("/posts/:postId", "put")).toEqual("UpdatePost");
  });
  test("Nested path with pair number of components should be name correctly in PascalCase", () => {
    expect(helpers.nameRoute("/posts/:postId/Comments", "get")).toEqual(
      "GetComments"
    );
    expect(
      helpers.nameRoute("/posts/:postId/Comments/:commentId", "get")
    ).toEqual("GetComment");
    expect(helpers.nameRoute("/posts/:postId/Comments", "post")).toEqual(
      "CreateComment"
    );
    expect(
      helpers.nameRoute("/posts/:postId/Comments/:commentId", "delete")
    ).toEqual("DeleteComment");
    expect(
      helpers.nameRoute("/posts/:postId/Comments/:commentId", "put")
    ).toEqual("UpdateComment");
  });
});

describe("formatHbs", () => {
  test("Should interpolate the data", () => {
    expect(
      helpers.formatHBS("{{foo}}{{mdr}}", { foo: "kappa", mdr: "bonjour" })
    ).toEqual("kappabonjour");
  });
});

describe("createFileFromHBS", () => {
  test("Should call appropriate function", () => {
    const readFile = jest.spyOn(fs, "readFileSync").mockReturnValue("{{lol}}");
    const formatHBS = jest.spyOn(helpers, "formatHBS");
    const ensureFileSync = jest.spyOn(fs, "ensureFileSync");
    const writeFileSync = jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation(() => 0);

    helpers.createFileFromHBS({
      filePath: "lol",
      templatePath: "mdr",
      data: {
        lol: "salut",
      },
    });
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(formatHBS).toHaveBeenCalledTimes(1);
    expect(ensureFileSync).toHaveBeenCalledTimes(1);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });
});

describe("getExportedMembersFromFile", () => {
  test("Should return false if no path is specified", () => {
    //@ts-ignore
    const result = helpers.getExportedMembersFromFile();
    expect(result).toEqual(false);
  });
  test("Should return false if file is not js", () => {
    //@ts-ignore
    global.require = () => ({ should: "not_work" });
    const result = helpers.getExportedMembersFromFile("test/lol.txt");
    expect(result).toEqual(false);
  });
  test("Should return the exported members of a javascript file", () => {
    //@ts-ignore
    global.require = () => ({ should: "not_work" });
    const result = helpers.getExportedMembersFromFile("test/lol.js");
    expect(result).toEqual({ should: "not_work" });
  });
  test("Should return the exported members of a javascript file", () => {
    //@ts-ignore
    global.require = () => ({ should: "not_work" });
    const result = helpers.getExportedMembersFromFile("test/lol.ts");
    expect(result).toEqual({ should: "not_work" });
  });
  test("Should return false on error", () => {
    //@ts-ignore
    global.require = () => {
      throw new Error("");
    };
    const result = helpers.getExportedMembersFromFile("test/lol.js");
    expect(result).toEqual(false);
  });
});

describe("getTypeFromVariable", () => {
  test("String with enum should return an enum", () => {
    expect(
      helpers.getTypeFromVariable({
        type: "string",
        description: "",
        enum: ["lol", "mdr"],
        example: "",
        required: true,
      })
    ).toEqual("'lol'|'mdr'");
  });
  test("String should return string", () => {
    expect(
      helpers.getTypeFromVariable({
        type: "string",
        description: "",
        example: "",
        required: true,
      })
    ).toEqual("string");
  });
  test("Password should return string", () => {
    expect(
      helpers.getTypeFromVariable({
        type: "password",
        description: "",
        example: "",
        required: true,
      })
    ).toEqual("string");
  });
  test("Date should return string", () => {
    expect(
      helpers.getTypeFromVariable({
        type: "date",
        description: "",
        example: "",
        required: true,
      })
    ).toEqual("string");
  });
  test("Number should return number", () => {
    expect(
      helpers.getTypeFromVariable({
        type: "number",
        description: "",
        example: 2,
        required: true,
      })
    ).toEqual("number");
  });
  test("Integer should return number", () => {
    expect(
      helpers.getTypeFromVariable({
        type: "integer",
        description: "",
        example: 2,
        required: true,
      })
    ).toEqual("number");
  });
  test("Ref should return ref value", () => {
    expect(
      helpers.getTypeFromVariable({
        type: "ref",
        description: "",
        ref: "User",
        required: true,
      })
    ).toEqual("User");
  });
  test("Ref should return params value if provided", () => {
    expect(
      helpers.getTypeFromVariable(
        {
          type: "ref",
          description: "",
          ref: "User",
          required: true,
        },
        ["T"]
      )
    ).toEqual("T");
  });
  test("Boolean should return boolean", () => {
    expect(
      helpers.getTypeFromVariable({
        type: "boolean",
        description: "",
        example: true,
        required: true,
      })
    ).toEqual("boolean");
  });
  test("Array should call getTypeFromVariable with same parameters", () => {
    const spy = jest.spyOn(helpers, "getTypeFromVariable");
    const result = helpers.getTypeFromVariable(
      {
        type: "array",
        description: "",
        items: {
          type: "boolean",
          description: "",
          example: true,
          required: true,
        },
        required: true,
      },
      ["T"]
    );
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result).toEqual("Array<boolean>");
    expect(
      helpers.getTypeFromVariable(
        {
          type: "array",
          description: "",
          items: {
            type: "ref",
            description: "",
            ref: "USer",
            required: true,
          },
          required: true,
        },
        ["T"]
      )
    ).toEqual("Array<T>");
  });
  test("Object should call convertObjectTypeToInterfaceContent", () => {
    const spy = jest.spyOn(helpers, "convertObjectTypeToInterfaceContent");
    const result = helpers.getTypeFromVariable({
      type: "object",
      description: "",
      properties: {
        bool: {
          type: "boolean",
          description: "",
          example: true,
          required: true,
        },
      },
      required: true,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(helpers.normalize(result)).toEqual("{bool:boolean}");
  });
  test("Nested Objects should be valid", () => {
    const result = helpers.getTypeFromVariable({
      type: "object",
      description: "",
      properties: {
        bool: {
          type: "object",
          description: "",
          properties: {
            bool: {
              type: "boolean",
              description: "",
              example: true,
              required: false,
            },
          },
          required: true,
        },
      },
      required: true,
    });
    expect(helpers.normalize(result)).toEqual("{bool:{bool?:boolean}}");
  });
  test("Nested Objects in array should be valid", () => {
    const result = helpers.getTypeFromVariable({
      type: "array",
      description: "",
      items: {
        type: "object",
        description: "",
        properties: {
          bool: {
            type: "object",
            description: "",
            properties: {
              bool: {
                type: "boolean",
                description: "",
                example: true,
                required: false,
              },
            },
            required: true,
          },
        },
        required: true,
      },
      required: true,
    });
    expect(helpers.normalize(result)).toEqual("Array<{bool:{bool?:boolean}}>");
  });
});
