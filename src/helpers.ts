import { camelCase, pascalCase } from "change-case";
import { ensureFileSync, readFileSync, writeFileSync } from "fs-extra";
import * as glob from "glob";
import * as handlebars from "handlebars";
import {
  allOf,
  anyOf,
  ObjectType,
  oneOf,
  Variable,
  VariableRef,
} from "mentine";
import { join } from "path";
import { format } from "prettier";
import inquirer = require("inquirer");

handlebars.registerHelper("pascalCase", function (options) {
  return pascalCase(options.fn(this));
});

handlebars.registerHelper("camelCase", function (options) {
  return camelCase(options.fn(this));
});

handlebars.registerHelper("ifOr", function (...args) {
  const options = args.pop();
  if (args.some((arg) => !!arg)) {
    return options.fn(this);
  }
  return options.inverse(this);
});

export const getTypeFromVariable = (
  variable: Variable,
  refArray?: string[]
): string => {
  if (
    variable.type === "string" ||
    variable.type === "password" ||
    variable.type === "date"
  ) {
    return `string`;
  } else if (variable.type === "boolean") {
    return `boolean`;
  } else if (variable.type === "number" || variable.type === "integer") {
    return `number`;
  } else if (variable.type === "ref") {
    return `${refArray?.shift() || variable.ref}`;
  } else if (variable.type === "array") {
    return `Array<${getTypeFromVariable(variable.items, refArray)}>`;
  } else {
    return convertObjectTypeToInterfaceContent(variable.properties, refArray);
  }
};

export const convertOneOfAllOfAnyOfOrObjectTypeToInterface = (
  value:
    | ObjectType<Variable>
    | oneOf<ObjectType<Variable> | VariableRef>
    | allOf<ObjectType<Variable> | VariableRef>
    | anyOf<ObjectType<Variable> | VariableRef>,
  refArray?: string[]
): string => {
  if (value.type === "allOf") {
    return (
      "{" +
      value.subSchemas
        .map((schema) => {
          if (schema.type === "ref") {
            console.warn("Ref in allOf is not implemented yet");
            return "";
          }
          return convertObjectTypeToInterfaceContent(
            schema as ObjectType<Variable>,
            refArray
          )
            .replace("{", "")
            .replace("}", "");
        })
        .join("\n") +
      "}"
    );
  } else if (value.type === "anyOf") {
    return value.subSchemas
      .map((schema) =>
        schema.type === "ref"
          ? getTypeFromVariable(schema as VariableRef, refArray)
          : convertObjectTypeToInterfaceContent(
              schema as ObjectType<Variable>,
              refArray
            )
      )
      .join("|");
  } else if (value.type === "oneOf") {
    return value.subSchemas
      .map((schema) =>
        schema.type === "ref"
          ? getTypeFromVariable(schema as VariableRef, refArray)
          : convertObjectTypeToInterfaceContent(
              schema as ObjectType<Variable>,
              refArray
            )
      )
      .join("|");
  } else {
    return convertObjectTypeToInterfaceContent(value, refArray);
  }
};

export const convertObjectTypeToInterfaceContent = (
  object: {
    [key: string]: Variable;
  },
  refsArray?: string[]
): string => {
  return (
    "{" +
    Object.entries(object)
      .map(([key, value]) => {
        const base = `${key}${!value.required ? "?" : ""}:`;
        return `${base} ${getTypeFromVariable(value, refsArray)}`;
      })
      .join("\n") +
    "}"
  );
};

export const buildFolderStructureFromPath = (path: string): string => {
  if (path[0] === "/") path = path.replace("/", "");
  return join(
    ...path
      .split("/")
      .filter((element) => !element.includes(":"))
      .map((element) => pascalCase(element))
  );
};

export const nameRoute = (
  path: string,
  method: "get" | "post" | "put" | "delete"
): string => {
  const verbMap = {
    get: "Get",
    post: "Create",
    put: "Update",
    delete: "Delete",
  };
  const filteredPath = path.split("/").filter(Boolean).reverse();
  const componentIndex = filteredPath.findIndex(
    (component) => !component.includes(":")
  );
  const component = filteredPath[componentIndex];
  return pascalCase(
    `${verbMap[method]}${pascalCase(
      method !== "get" || componentIndex === 1
        ? component.slice(0, component.length - 1)
        : component
    )}`
  );
};

export const filesMatching = (globString: string) => {
  return new Promise<Array<string>>((res) =>
    glob(globString, (err, files) => res(files))
  );
};

export const normalize = (string: string) => string.replace(/[ \n]/g, "");
export const fileExists = async (globStringOrFiles: string | string[]) => {
  return (
    (Array.isArray(globStringOrFiles)
      ? globStringOrFiles
      : await filesMatching(globStringOrFiles)
    ).length > 0
  );
};

export const formatHBS = (hbs: string, data: any): string => {
  const template = handlebars.compile(hbs);
  return template(data);
};

export const createFileFromHBS = ({ filePath, templatePath, data }) => {
  const source = readFileSync(templatePath);
  const outputString = formatHBS(source.toString(), data);
  ensureFileSync(filePath);
  writeFileSync(filePath, outputString);
};

export const getExportedMembersFromFile = (filePath: string) => {
  try {
    if (!filePath || (!filePath.endsWith(".js") && !filePath.endsWith(".ts")))
      return false;
    const requiredFile = global.require(filePath);
    return requiredFile;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const getNextRouteId = async () => {
  return (
    (await filesMatching(join(process.cwd(), "src", "**/*", "*.route.ts")))
      .length + 1
  );
};

export const prettify = (filePath: string) => {
  const source = readFileSync(filePath);
  const formatted = format(source.toString(), {
    parser: "typescript",
  });
  writeFileSync(filePath, formatted);
};

export const checkExistence = async (
  filePaths: Array<string>
): Promise<Array<string>> => {
  const exists = [];
  for (const filePath of filePaths) {
    if (await fileExists(filePath)) {
      exists.push(filePath);
    }
  }
  return exists;
};

export const checkForFilesAndPromptForOverride = async (
  filePaths: Array<string>
): Promise<Array<string>> => {
  const exists = await checkExistence(filePaths);
  const toCreate = filePaths.filter((file) => !exists.includes(file));
  if (exists.length > 0) {
    const result = await inquirer.prompt([
      {
        type: "checkbox",
        name: "overwrite",
        message: "Those files alredy exists, which do you want to overwrite?",
        choices: exists,
      },
    ]);
    toCreate.push(...result.overwrite);
  }
  return toCreate;
};

export const generateFiles = async (
  toGenerate: Array<{
    filePath: string;
    templatePath: string;
  }>,
  data: any
) => {
  const filtered = await checkForFilesAndPromptForOverride(
    toGenerate.map((file) => file.filePath)
  );
  toGenerate.forEach(({ filePath, templatePath }) => {
    if (filtered.includes(filePath)) {
      createFileFromHBS({
        filePath,
        data,
        templatePath,
      });
      prettify(filePath);
    }
  });
};
