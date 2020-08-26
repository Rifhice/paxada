import { pascalCase } from "change-case";
import { ensureFileSync, readFileSync, writeFileSync } from "fs-extra";
import * as glob from "glob";
import * as handlebars from "handlebars";
import { join } from "path";
import { format } from "prettier";

handlebars.registerHelper("pascalCase", function (options) {
  return pascalCase(options.fn(this));
});

handlebars.registerHelper("ifOr", function (...args) {
  const options = args.pop();
  if (args.some((arg) => !!arg)) {
    return options.fn(this);
  }
  return options.inverse(this);
});

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
