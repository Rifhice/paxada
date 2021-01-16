import { readFile, writeFile } from "fs-extra";
import { EntityUserPrompt } from "./entity/generator";
import { RouteUserPrompt } from "./route/generator";

export const getLastCommands = async (
  databaseFilePath: string
): Promise<Array<RouteUserPrompt | EntityUserPrompt>> => {
  return new Promise(async (resolve) => {
    readFile(databaseFilePath, (err, result) =>
      resolve(result ? JSON.parse(result.toString()) : [])
    );
  });
};

export const saveCommand = async (
  databaseFilePath: string,
  command: RouteUserPrompt | EntityUserPrompt
): Promise<void> => {
  return new Promise(async (resolve) => {
    const history = await getLastCommands(databaseFilePath);
    history.unshift(command);
    if (history.length > 10) history.pop();
    writeFile(databaseFilePath, JSON.stringify(history), () => resolve());
  });
};
