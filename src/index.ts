#!/usr/bin/env node
import { Command } from "commander";
import { copy } from "fs-extra";
import { join } from "path";
const program = new Command();

program.option(
  "-p, --path <path>",
  "Path where to generate files",
  "my-express-app/"
);

program.parse(process.argv);

const { path } = program;

copy(join(__dirname, "template/"), path);
