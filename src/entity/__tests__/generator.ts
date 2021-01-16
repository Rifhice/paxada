import * as inquirer from "inquirer";
import * as mentine from "mentine";
import { join } from "path";
import * as helpers from "../../helpers";
import * as generator from "../generator";

jest.mock("mentine", () => ({
  validateEntity: () => {},
}));

//@ts-ignore
jest.spyOn(helpers, "generateFiles").mockImplementation(() => {});

describe("getEntityName", () => {
  test("Should call inquirer", () => {
    const spy = jest.spyOn(inquirer, "prompt");
    generator.getEntityName();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("buildEntitiesPath", () => {
  test("Should return a path", () => {
    expect(generator.buildEntitiesPath()).toEqual(
      join(process.cwd(), "src", "entities")
    );
  });
});

describe("getDocFilePathIfExists", () => {
  test("Should call buildEntitiesPath", () => {
    const spy = jest.spyOn(generator, "buildEntitiesPath");
    generator.getDocFilePathIfExists("lol");
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Should look for a .doc.file", () => {
    jest.clearAllMocks();
    jest.spyOn(generator, "buildEntitiesPath").mockReturnValueOnce("salut");
    const spy = jest.spyOn(helpers, "filesMatching");
    generator.getDocFilePathIfExists("lol");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("salut/lol/lol.doc.ts");
  });
  test("Should look for a .doc.file", () => {
    jest.clearAllMocks();
    jest.spyOn(generator, "buildEntitiesPath").mockReturnValueOnce("undefined");
    const spy = jest.spyOn(helpers, "filesMatching").mockResolvedValueOnce([]);
    generator.getDocFilePathIfExists("lol");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("undefined/lol/lol.doc.ts");
  });
});

describe("generateDocFile", () => {
  test("Should call generateFiles", () => {
    const spy = jest.spyOn(helpers, "generateFiles");
    generator.generateDocFile("lol");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      [
        {
          filePath: generator.buildFilePath("lol", ".doc.ts"),
          templatePath: generator.buildTemplatePath("doc.template.hbs"),
        },
      ],
      { name: "lol" }
    );
  });
});

describe("generateEntity", () => {
  test("Should call getEntityName", () => {
    const spy = jest.spyOn(generator, "getEntityName");
    generator.generateEntity();
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("Error on empty name", async (done) => {
    expect(generator.generateEntity()).rejects.toEqual(new Error());
    expect(generator.generateEntity()).rejects.toEqual(new Error());
    expect(generator.generateEntity()).rejects.toEqual(new Error());
    done();
  });
  test("Should look for a doc file", () => {
    jest.spyOn(generator, "getEntityName").mockResolvedValue("lol");
    const spy = jest.spyOn(generator, "getDocFilePathIfExists");
    generator.getDocFilePathIfExists("lol");
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test("If no doc file should generate it", async (done) => {
    jest
      .spyOn(generator, "getDocFilePathIfExists")
      .mockResolvedValueOnce(undefined);
    const spy = jest.spyOn(generator, "generateDocFile");
    await generator.generateEntity();
    expect(spy).toHaveBeenCalledTimes(1);
    done();
  });
  test("If doc file should generate other files", async (done) => {
    jest
      .spyOn(generator, "getDocFilePathIfExists")
      .mockResolvedValueOnce("Salut");
    const getExportedMembersFromFile = jest
      .spyOn(helpers, "getExportedMembersFromFile")
      .mockResolvedValueOnce({
        entity: {
          simplified: true,
          name: "lol",
          schema: {
            id: {
              type: "string",
              description: "string",
              required: true,
              example: "d",
            },
          },
        },
      });
    const extractDataFrom = jest.spyOn(generator, "extractDataFrom");
    const generateEntityFiles = jest.spyOn(generator, "generateEntityFiles");
    const validateEntity = jest.spyOn(mentine, "validateEntity");

    await generator.generateEntity();

    expect(getExportedMembersFromFile).toHaveBeenCalledTimes(1);
    expect(validateEntity).toHaveBeenCalledTimes(1);
    expect(extractDataFrom).toHaveBeenCalledTimes(1);
    expect(generateEntityFiles).toHaveBeenCalledTimes(1);
    done();
  });
});

describe("extractDataFrom", () => {
  test("Should return appropriate value", () => {
    const {
      name,
      interfaceData,
      refsCount,
      defaultGeneric,
      genericsWithDefault,
      mongooseData,
    } = generator.extractDataFrom({
      simplified: true,
      name: "Salut",
      schema: {
        id: {
          type: "string",
          description: "d",
          example: "s",
          required: true,
        },
      },
    });
    expect(helpers.normalize(name)).toEqual("Salut");
    expect(helpers.normalize(interfaceData)).toEqual(
      helpers.normalize(`{id: string}`)
    );
    expect(refsCount).toEqual(0);
    expect(helpers.normalize(defaultGeneric)).toEqual(
      helpers.normalize("mongoose.Schema.Types.ObjectId")
    );
    expect(helpers.normalize(genericsWithDefault)).toEqual(
      helpers.normalize("")
    );
    expect(helpers.normalize(mongooseData)).toEqual(
      helpers.normalize(`{id: { type: String  , required: true   }}`)
    );
  });
});
