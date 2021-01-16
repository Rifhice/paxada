import { ObjectType, Route, validateRoute, Variable } from "mentine";
import { join } from "path";
import {
  buildFolderStructureFromPath,
  fileExists,
  filesMatching,
  generateFiles,
  getExportedMembersFromFile,
  getNextRouteId,
  nameRoute,
} from "../helpers";
import {
  getSanitizers,
  getTypescriptInterfaces,
  getValidators,
} from "./converter";
import inquirer = require("inquirer");

export const checkRouteFileExists = async (folderPath: string) => {
  const interfacesFileExists = await fileExists(
    join(process.cwd(), folderPath, "*.interfaces.ts")
  );
  const routeFileExists = await fileExists(
    join(process.cwd(), folderPath, "*.route.ts")
  );
  const indexFileExists = await fileExists(
    join(process.cwd(), folderPath, "*.index.ts")
  );
  const validatorsFileExists = await fileExists(
    join(process.cwd(), folderPath, "*.validators.ts")
  );
  return {
    interfacesFileExists,
    routeFileExists,
    indexFileExists,
    validatorsFileExists,
  };
};

const promptRouteInfo = () => {
  return inquirer.prompt([
    {
      type: "confirm",
      name: "isPrivate",
      message: "Is it a private route?",
    },
    {
      type: "list",
      name: "method",
      message: "Route method",
      choices: ["get", "post", "put", "delete"],
    },
    {
      type: "input",
      name: "path",
      message: "Route path",
    },
  ]);
};

export const extractDataFromDoc = (doc: Route, name?: string) => {
  if (!name) name = nameRoute(doc.path, doc.method);
  const typescriptInterfaces = getTypescriptInterfaces(doc, name);
  const result: {
    typescriptInterfaces: ReturnType<typeof getTypescriptInterfaces>;
    bodyValidators?: ReturnType<typeof getValidators>;
    bodySanitizer?: ReturnType<typeof getSanitizers>;
    pathValidators?: ReturnType<typeof getValidators>;
    queryValidators?: ReturnType<typeof getValidators>;
    querySanitizer?: ReturnType<typeof getSanitizers>;
    interfacesString: string;
    doc: Route;
    name: string;
    hasBody: boolean;
    hasQuery: boolean;
    hasParam: boolean;
    validators?: string;
  } = {
    typescriptInterfaces,
    interfacesString: formatTypescriptInterface(typescriptInterfaces),
    doc,
    name,
    hasBody: Object.keys(doc).includes("body"),
    hasQuery: doc.queryVariables && Object.keys(doc.queryVariables).length > 0,
    hasParam: doc.pathVariables && Object.keys(doc.pathVariables).length > 0,
  };
  if ((doc.method === "post" || doc.method === "put") && doc.body) {
    result.bodyValidators = getValidators(doc.body).map(
      (validator) => `body${validator}`
    );
    if (
      doc.body.type === "allOf" ||
      doc.body.type === "anyOf" ||
      doc.body.type === "oneOf"
    )
      console.warn(
        "Sanitizer for allOf | anyOf | oneOf body type are not implemented"
      );
    result.bodySanitizer = getSanitizers(doc.body as ObjectType<Variable>);
  }
  if (doc.pathVariables)
    result.pathValidators = getValidators(doc.pathVariables).map(
      (validator) => `param${validator}`
    );
  if (doc.queryVariables) {
    result.queryValidators = getValidators(doc.queryVariables).map(
      (validator) => `query${validator}`
    );
    result.querySanitizer = getSanitizers(doc.queryVariables);
  }
  result.validators = [
    ...(!!result.bodyValidators ? result.bodyValidators : []),
    ...(!!result.pathValidators ? result.pathValidators : []),
    ...(!!result.queryValidators ? result.queryValidators : []),
  ].join(",");
  return result;
};

export const extractDataFromDocFile = (docPath: string, name?: string) => {
  const exportedMembers = getExportedMembersFromFile(docPath);
  const { route } = exportedMembers;
  if (!route) throw Error();
  validateRoute(route);
  return extractDataFromDoc(route, name);
};

export const formatTypescriptInterface = (
  interfaces: ReturnType<typeof getTypescriptInterfaces>
): string => {
  return interfaces
    .map(
      (int) => `
    export interface ${int.interfaceName}
     ${int.interfaceContent}
  `
    )
    .join("\n");
};

export type RouteUserPromptAgreedPath = {
  method: string;
  path: string;
  isPrivate: boolean;
  generateAtGeneratedPath: true;
};
export type RouteUserPromptDisagreedPath = {
  method: string;
  path: string;
  isPrivate: boolean;
  generateAtGeneratedPath: false;
  filesPath: string;
};

export type RouteUserPrompt =
  | RouteUserPromptAgreedPath
  | RouteUserPromptDisagreedPath;

export const routeUserPromptToString = (prompts: RouteUserPrompt): string => {
  return Object.entries(prompts)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
};

export const isRouteUserPrompt = (
  userPrompt: any
): userPrompt is RouteUserPrompt => {
  return typeof userPrompt.method === "string";
};

export default async function generateRoute(
  defaultUserPrompt?: RouteUserPrompt
): Promise<RouteUserPrompt> {
  try {
    let userPrompt: Partial<RouteUserPrompt> = {};

    const { method, path, isPrivate } =
      defaultUserPrompt !== undefined
        ? defaultUserPrompt
        : await promptRouteInfo();
    let name = nameRoute(path, method);
    let folderPath = join(
      "src",
      "routes",
      isPrivate ? "private" : "public",
      buildFolderStructureFromPath(path),
      name
    );

    const { agreed } =
      defaultUserPrompt !== undefined
        ? { agreed: defaultUserPrompt.generateAtGeneratedPath }
        : await inquirer.prompt([
            {
              type: "confirm",
              name: "agreed",
              message: "The route files will be generated at " + folderPath,
            },
          ]);

    userPrompt = { method, path, isPrivate, generateAtGeneratedPath: agreed };

    if (!agreed) {
      const { path } =
        defaultUserPrompt !== undefined
          ? {
              path: (defaultUserPrompt as RouteUserPromptDisagreedPath)
                .filesPath,
            }
          : await inquirer.prompt([
              {
                type: "input",
                name: "path",
                message: "Where do you want to generate the files?",
              },
            ]);
      folderPath = path;
      name = path.split("/").pop();
      (userPrompt as RouteUserPromptDisagreedPath).filesPath = path;
    }

    const buildFilePath = (fileExtension) =>
      join(folderPath, folderPath.split("/").pop() + fileExtension);
    const buildTemplatePath = (templateFileName) =>
      join(__dirname, "..", "templates", "Route", templateFileName);

    const docFiles = await filesMatching(
      join(process.cwd(), folderPath, "*.doc.ts")
    );

    const docFile = docFiles[0];

    if (docFile) {
      const data = {
        isPrivate,
        ...extractDataFromDocFile(docFile, name),
        routeId: await getNextRouteId(),
      };

      generateFiles(
        [
          {
            filePath: buildFilePath(".interfaces.ts"),
            templatePath: buildTemplatePath("interfaces.template.hbs"),
          },
          {
            filePath: buildFilePath(".validators.ts"),
            templatePath: buildTemplatePath("validators.template.hbs"),
          },
          {
            filePath: join(folderPath, "index.ts"),
            templatePath: buildTemplatePath("index.template.hbs"),
          },
          {
            filePath: buildFilePath(".route.ts"),
            templatePath: buildTemplatePath("route.template.hbs"),
          },
        ],
        data
      );
    } else {
      generateFiles(
        [
          {
            filePath: buildFilePath(".doc.ts"),
            templatePath: buildTemplatePath("doc.template.hbs"),
          },
        ],
        {
          path,
          method,
          hasBody: method === "post" || method === "put",
        }
      );
    }
    return userPrompt as RouteUserPrompt;
  } catch (error) {
    console.log(error);
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else when wrong
    }
  }
}
