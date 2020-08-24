import { join } from "path";
import {
  buildFolderStructureFromPath,
  createFileFromHBS,
  fileExists,
  nameRoute,
} from "../helpers";
import inquirer = require("inquirer");

const checkRouteFileExists = async (folderPath: string) => {
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
      choices: ["GET", "POST", "PUT", "DELETE"],
    },
    {
      type: "input",
      name: "path",
      message: "Route path",
    },
  ]);
};

export default async function generateRoute() {
  try {
    const { method, path, isPrivate } = await promptRouteInfo();

    let folderPath = join(
      "src",
      isPrivate ? "private" : "public",
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

    const docFileExists = await fileExists(
      join(process.cwd(), folderPath, "*.doc.ts")
    );

    if (docFileExists) {
      const {
        interfacesFileExists,
        routeFileExists,
        indexFileExists,
        validatorsFileExists,
      } = await checkRouteFileExists(folderPath);
      const choices = [
        ...(interfacesFileExists ? ["interfaces.ts"] : []),
        ...(routeFileExists ? ["route.ts"] : []),
        ...(indexFileExists ? ["index.ts"] : []),
        ...(validatorsFileExists ? ["validators.ts"] : []),
      ];

      let overwrite;
      if (choices.length > 0) {
        const result = await inquirer.prompt([
          {
            type: "checkbox",
            name: "overwrite",
            message:
              "Those files alredy exists, which do you want to overwrite?",
            choices,
            default: choices,
          },
        ]);
        overwrite = result.overwrite;
      }
      console.log(overwrite);
      //generate files from doc (create if doesn't exists or overwrite if in the overwrite array)
    } else {
      //generate folder structure + doc
      createFileFromHBS({
        filePath: join(folderPath, folderPath.split("/").pop() + ".doc.ts"),
        data: {
          interfacesString: "lol",
        },
        templatePath: join(
          __dirname,
          "..",
          "templates",
          "Route",
          "interfaces.template.hbs"
        ),
      });
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
