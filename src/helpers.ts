import { pascalCase } from "change-case";
import { ensureFileSync, readFileSync, writeFileSync } from "fs-extra";
import * as glob from "glob";
import * as handlebars from "handlebars";
import { join } from "path";

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
  method: "GET" | "POST" | "PUT" | "DELETE"
): string => {
  const verbMap = {
    GET: "Get",
    POST: "Create",
    PUT: "Update",
    DELETE: "Delete",
  };
  const filteredPath = path.split("/").filter(Boolean).reverse();
  const componentIndex = filteredPath.findIndex(
    (component) => !component.includes(":")
  );
  const component = filteredPath[componentIndex];
  return pascalCase(
    `${verbMap[method]}${pascalCase(
      method !== "GET" || componentIndex === 1
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

export const fileExists = async (globString: string) => {
  return (await filesMatching(globString)).length > 0;
};

export const createFileFromHBS = ({ filePath, templatePath, data }) => {
  const source = readFileSync(templatePath);

  const template = handlebars.compile(source.toString());

  const outputString = template(data);
  ensureFileSync(filePath);
  writeFileSync(filePath, outputString);
};
