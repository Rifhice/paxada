#!/usr/bin/env node
require("typescript-require");
import { join } from "path";
import {
  entityUserPromptToString,
  generateEntity,
  isEntityUserPrompt,
} from "./entity/generator";
import { getLastCommands, saveCommand } from "./lastCommands";
import generateProject from "./project/generate";
import generateRoute, {
  isRouteUserPrompt,
  routeUserPromptToString,
} from "./route/generator";
import inquirer = require("inquirer");
global.require = require;

const databaseFilePath = join(__dirname, "commandHistory.json");

(async () => {
  const lastCommands = await getLastCommands(databaseFilePath);
  inquirer
    .prompt([
      {
        type: "list",
        name: "toGenerate",
        message: "What are you trying to generate?",
        choices: [
          "Route",
          "Entity",
          "Project",
          ...(lastCommands.length > 0
            ? [
                new inquirer.Separator("---- Last commands ----"),
                ...lastCommands.map((command, i) =>
                  isEntityUserPrompt(command)
                    ? `${i} - Entity ${entityUserPromptToString(command)}`
                    : isRouteUserPrompt(command)
                    ? `${i} - Route ${routeUserPromptToString(command)}`
                    : `${i} - ${command}`
                ),
              ]
            : []),
        ],
      },
    ])
    .then(async ({ toGenerate }) => {
      let userPrompts;
      if (toGenerate === "Route") {
        userPrompts = await generateRoute();
      } else if (toGenerate === "Entity") {
        userPrompts = await generateEntity();
      } else if (toGenerate === "Project") {
        generateProject();
      } else {
        const commandIndex = +toGenerate[0];
        const command = lastCommands[commandIndex];
        if (isEntityUserPrompt(command)) generateEntity(command);
        else if (isRouteUserPrompt(command)) generateRoute(command);
      }
      if (userPrompts) saveCommand(databaseFilePath, userPrompts);
    });
})();
