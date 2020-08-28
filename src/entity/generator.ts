import inquirer = require("inquirer");
import { Entity, ObjectType, validateEntity, Variable } from "mentine";
import { join } from "path";
import {
  filesMatching,
  generateFiles,
  getExportedMembersFromFile,
} from "../helpers";
import {
  buildGenericWithDefault,
  convertEntityToInterface,
  convertEntityToMongooseData,
  countRefs,
} from "./converter";

export type EntityData = {
  name: string;
  interfaceData: string;
  refsCount: number;
  defaultGeneric: string;
  genericsWithDefault: string;
  mongooseData: string;
};

export const getEntityName = (): Promise<{ name }> => {
  return inquirer.prompt([
    {
      type: "input",
      message: "What's the name of the entity?",
      name: "name",
    },
  ]);
};

export const buildEntitiesPath = () => {
  return join(process.cwd(), "src", "entities");
};

export const buildFilePath = (entityName: string, fileExtension: string) => {
  return join(buildEntitiesPath(), entityName, entityName + fileExtension);
};

export const buildTemplatePath = (templateFileName: string) => {
  return join(__dirname, "..", "templates", "Entity", templateFileName);
};

export const getDocFilePathIfExists = async (
  entity: string
): Promise<string | undefined> => {
  const entitiesPath = buildEntitiesPath();
  const fileMatching = await filesMatching(
    join(entitiesPath, entity, entity + ".doc.ts")
  );
  return fileMatching[0];
};

export const generateDocFile = (name: string) => {
  return generateFiles(
    [
      {
        filePath: buildFilePath(name, ".doc.ts"),
        templatePath: buildTemplatePath("doc.template.hbs"),
      },
    ],
    { name }
  );
};

export const generateEntityFiles = (data: EntityData) => {
  return generateFiles(
    [
      {
        filePath: join(
          buildEntitiesPath(),
          data.name,
          "persistance",
          data.name + ".model.ts"
        ),
        templatePath: buildTemplatePath("model.template.hbs"),
      },
      {
        filePath: join(
          buildEntitiesPath(),
          data.name,
          "persistance",
          data.name + ".interfaces.ts"
        ),
        templatePath: buildTemplatePath("interfaces.template.hbs"),
      },
      {
        filePath: join(
          buildEntitiesPath(),
          data.name,
          "persistance",
          data.name + ".dao.ts"
        ),
        templatePath: buildTemplatePath("dao.template.hbs"),
      },
      {
        filePath: buildFilePath(data.name, ".subscribers.ts"),
        templatePath: buildTemplatePath("subscribers.template.hbs"),
      },
      {
        filePath: buildFilePath(data.name, ".services.ts"),
        templatePath: buildTemplatePath("services.template.hbs"),
      },
    ],
    data
  );
};

export const extractDataFrom = (entity: Entity): EntityData => {
  const defaultGeneric = "ObjectId";
  return {
    name: entity.name,
    interfaceData: convertEntityToInterface(entity),
    refsCount: countRefs(entity.schema as ObjectType<Variable>),
    defaultGeneric,
    genericsWithDefault: buildGenericWithDefault(
      entity.schema as ObjectType<Variable>,
      defaultGeneric
    ),
    mongooseData: convertEntityToMongooseData(entity),
  };
};

export const generateEntity = async () => {
  const result = await getEntityName();
  if (!result || !result.name) throw Error();
  const { name } = result;
  const docFilePath = await getDocFilePathIfExists(name);
  if (!docFilePath) {
    await generateDocFile(name);
  } else {
    const docFileContent = await getExportedMembersFromFile(docFilePath);
    validateEntity(docFileContent.entity);
    const data = extractDataFrom(docFileContent.entity);
    await generateEntityFiles(data);
  }
};
