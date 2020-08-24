import { exec } from "child_process";
import { join } from "path";
import routeGenerator from "./route/generator";

export default function (plop) {
  plop.setHelper("ifEquals", function (arg1, arg2, options) {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  });

  plop.setGenerator("Route", routeGenerator);
  plop.setActionType("prettify", (answers, config) => {
    const folderPath = `${join(
      __dirname,
      "..//../../src/",
      config.path,
      plop.getHelper("properCase")(answers.name),
      "**/*.ts*"
    )}`;
    exec(`npm run prettify -- "${folderPath}"`);
    return folderPath;
  });
}
