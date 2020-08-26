import * as mentine from "mentine";
import { Route } from "mentine";
import { join } from "path";
import * as helpers from "../../helpers";
import * as converters from "../converter";
import * as generators from "../generator";

jest.mock("mentine", () => ({
  validateRoute: () => {},
}));

const getDoc: Route = {
  simplified: true,
  path: "/api/user/:id/blacklist",
  method: "get",
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
  responses: {
    204: {
      description: "Salut",
    },
  },
};

const putDoc: Route = {
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

describe("extractDataFromDocFile", () => {
  test("Should call require with the given path", () => {
    const spy = jest
      .spyOn(helpers, "getExportedMembersFromFile")
      .mockReturnValueOnce({ route: "mdr" });
    jest
      .spyOn(generators, "extractDataFromDoc")
      //@ts-ignore
      .mockReturnValueOnce("wow");
    generators.extractDataFromDocFile("lol");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("lol");
  });

  test("Should throw error if no route members is exported from file", () => {
    const spy = jest
      .spyOn(helpers, "getExportedMembersFromFile")
      .mockReturnValueOnce({ lol: "mdr" });
    expect(() => generators.extractDataFromDocFile("lol")).toThrowError(Error);
  });
  test("Should call validate route on exported route", () => {
    jest
      .spyOn(helpers, "getExportedMembersFromFile")
      .mockReturnValueOnce({ route: "mdr" });
    jest
      .spyOn(generators, "extractDataFromDoc")
      //@ts-ignore
      .mockReturnValueOnce("wow");
    const spy = jest.spyOn(mentine, "validateRoute");
    generators.extractDataFromDocFile("lol");
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call extractDataFromDoc and return it's value", () => {
    jest.clearAllMocks();
    jest
      .spyOn(helpers, "getExportedMembersFromFile")
      .mockReturnValueOnce({ route: "mdr" });
    const spy = jest
      .spyOn(generators, "extractDataFromDoc")
      //@ts-ignore
      .mockReturnValueOnce("wow");
    const res = generators.extractDataFromDocFile("lol");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(res).toEqual("wow");
  });
});

describe("extractDataFromDoc", () => {
  test("Should call nameRoute if no name is specified", () => {
    const spy = jest.spyOn(helpers, "nameRoute");
    //@ts-ignore
    generators.extractDataFromDoc(getDoc);
    expect(spy).toHaveBeenCalledTimes(1);
    //@ts-ignore
    generators.extractDataFromDoc(getDoc, "lol");
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call getTypescriptInterfaces", () => {
    const spy = jest.spyOn(converters, "getTypescriptInterfaces");
    generators.extractDataFromDoc(getDoc);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call getSanitizers once for route with no body", () => {
    const spy = jest.spyOn(converters, "getSanitizers");
    generators.extractDataFromDoc(getDoc);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call getSanitizers twice for route with a body", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "getSanitizers");
    generators.extractDataFromDoc(putDoc);
    expect(spy).toHaveBeenCalledTimes(2);
  });
  test("Should call getValidators once for route with query variables", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "getValidators");
    const { pathVariables, ...copy } = getDoc;
    generators.extractDataFromDoc(copy);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should call getValidators twice for route with path variables", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "getValidators");
    generators.extractDataFromDoc(getDoc);
    expect(spy).toHaveBeenCalledTimes(2);
  });
  test("Should call getValidators three times for route with a body", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(converters, "getValidators");
    generators.extractDataFromDoc(putDoc);
    expect(spy).toHaveBeenCalledTimes(3);
  });
  test("AllOf, oneOf, anyOf body type not implemented", () => {
    jest.clearAllMocks();
    const spy = jest.spyOn(console, "warn");
    generators.extractDataFromDoc({
      ...putDoc,
      body: {
        type: "allOf",
        subSchemas: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    generators.extractDataFromDoc({
      ...putDoc,
      body: {
        type: "anyOf",
        subSchemas: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(2);
    generators.extractDataFromDoc({
      ...putDoc,
      body: {
        type: "oneOf",
        subSchemas: [],
      },
    });
    expect(spy).toHaveBeenCalledTimes(3);
  });
});

describe("checkRouteFileExists", () => {
  test("Should call fileExists four times", async (done) => {
    jest.clearAllMocks();
    const spy = jest
      .spyOn(helpers, "fileExists")
      .mockResolvedValue(Promise.resolve(true));
    const res = await generators.checkRouteFileExists("lol");
    expect(spy).toHaveBeenCalledWith(
      join(process.cwd(), "lol", "*.interfaces.ts")
    );
    expect(spy).toHaveBeenCalledWith(join(process.cwd(), "lol", "*.route.ts"));
    expect(spy).toHaveBeenCalledWith(join(process.cwd(), "lol", "*.index.ts"));
    expect(spy).toHaveBeenCalledWith(
      join(process.cwd(), "lol", "*.validators.ts")
    );
    expect(spy).toHaveBeenCalledTimes(4);
    expect(res).toEqual({
      interfacesFileExists: true,
      routeFileExists: true,
      indexFileExists: true,
      validatorsFileExists: true,
    });
    done();
  });
});

describe("formatTypescriptInterface", () => {
  test("Should return valid value", () => {
    expect(
      helpers.normalize(
        generators.formatTypescriptInterface([
          {
            interfaceContent: "{id: string}",
            interfaceName: "GreatInterface",
          },
          {
            interfaceContent: "{start: number}",
            interfaceName: "GreatInterface2",
          },
        ])
      )
    ).toEqual(
      helpers.normalize(`
            export interface GreatInterface {
                id: string
            }
            export interface GreatInterface2 {
                start: number
            }
        `)
    );
  });
});
