import inquirer = require("inquirer");
import { copy } from "fs-extra";
import { join } from "path";

export default function generateProject() {
  inquirer
    .prompt([
      {
        type: "path",
        name: "path",
        message: "Where?",
        default: join(process.cwd() , "my-app"),
      },
    ])
    .then(({ path }) => {
      copy(join(__dirname, "..", "templates/Project"), path);
    });
}
