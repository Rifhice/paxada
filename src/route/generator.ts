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
    hasQuery: Object.keys(doc.queryVariables).length > 0,
    hasParam: Object.keys(doc.pathVariables).length > 0,
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

export const extractDataFromDocFile = (docPath: string) => {
  const exportedMembers = getExportedMembersFromFile(docPath);
  const { route } = exportedMembers;
  if (!route) throw Error();
  validateRoute(route);
  return extractDataFromDoc(route);
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

export default async function generateRoute() {
  try {
    const { method, path, isPrivate } = await promptRouteInfo();

    let folderPath = join(
      "src",
      isPrivate ? "private" : "public",
      "route",
      buildFolderStructureFromPath(path),
      nameRoute(path, method)
    );

    const { agreed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "agreed",
        message: "The route files will be generated at " + folderPath,
      },
    ]);

    if (!agreed) {
      const { path } = await inquirer.prompt([
        {
          type: "input",
          name: "path",
          message: "Where do you want to generate the files?",
        },
      ]);
      folderPath = path;
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
        ...extractDataFromDocFile(docFile),
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
            filePath: buildFilePath(".index.ts"),
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
          hasBody: method === "POST" || method === "PUT",
        }
      );
    }
  } catch (error) {
    console.log(error);
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else when wrong
    }
  }
}
