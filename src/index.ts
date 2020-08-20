#!/usr/bin/env node
import { Command } from "commander";
import { copy } from "fs-extra";
const program = new Command();

program.option(
  "-p, --path <path>",
  "Path where to generate files",
  "my-express-app/"
);

program.parse(process.argv);

const { path } = program;

copy("template/", path);
