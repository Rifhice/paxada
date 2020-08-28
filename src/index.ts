#!/usr/bin/env node
require("typescript-require");
import { generateEntity } from "./entity/generator";
import generateProject from "./project/generate";
import generateRoute from "./route/generator";
import inquirer = require("inquirer");
global.require = require;

inquirer
  .prompt([
    {
      type: "list",
      name: "toGenerate",
      message: "What are you trying to generate?",
      choices: ["Route", "Entity", "Project"],
    },
  ])
  .then(({ toGenerate }) => {
    if (toGenerate === "Route") {
      generateRoute();
    } else if (toGenerate === "Entity") {
      generateEntity();
    } else if (toGenerate === "Project") {
      generateProject();
    }
  });

// const { path: generationPath } = program;

// const doc: Route = {
//   simplified: true,
//   path: "/api/user/:id/blacklist",
//   method: "put",
//   tag: "User",
//   summary: "lalalla",
//   description: "lelelel",
//   pathVariables: {
//     id: {
//       type: "string",
//       description: "Id of user",
//       example: "3",
//       required: true,
//     },
//   },
//   queryVariables: {
//     start: {
//       type: "integer",
//       description: "Paging start",
//       required: true,
//       example: 20,
//     },
//   },
//   body: {
//     blacklist: {
//       type: "boolean",
//       description: "blacklisted",
//       example: true,
//       required: true,
//     },
//   },
//   responses: {
//     204: {
//       description: "Salut",
//     },
//   },
// };

// // copy(join(__dirname, "template/"), path);
// console.log(
//   getTypescriptInterfaces(doc, "Blacklist"),
//   getValidators(doc.body).map((validator) => `body${validator}`),
//   getValidators(doc.pathVariables).map((validator) => `path${validator}`),
//   getValidators(doc.queryVariables).map((validator) => `query${validator}`),
//   getSanitizers(doc.queryVariables),
//   getSanitizers(doc.pathVariables)
// );
