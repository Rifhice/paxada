import { removeSync } from "fs-extra";
import { getLastCommands, saveCommand } from "../lastCommands";

const testDatabaseFilePath = "lastTestsCommands.json";

describe("lastCommands", () => {
  beforeAll(() => {
    removeSync(testDatabaseFilePath);
  });
  afterAll(() => {
    removeSync(testDatabaseFilePath);
  });
  describe("integration tests", () => {
    it("If the file doesn't exists, should return empty array", async () => {
      expect(await getLastCommands(testDatabaseFilePath)).toEqual([]);
    });
    it("Should create the file if it doesn't exists", async () => {
      await saveCommand(testDatabaseFilePath, { name: "lol" });
      expect(await getLastCommands(testDatabaseFilePath)).toEqual([
        { name: "lol" },
      ]);
    });

    it("Should append the command in the file", async () => {
      await saveCommand(testDatabaseFilePath, { name: "mdr" });
      expect(await getLastCommands(testDatabaseFilePath)).toEqual([
        { name: "mdr" },
        { name: "lol" },
      ]);
    });
    it("Should return the last 10 commands", async () => {
      const commands = Array(10)
        .fill("a")
        .map(() => ({ name: String(Math.random()) }));
      for (const command of commands) {
        await saveCommand(testDatabaseFilePath, command);
      }
      expect(await getLastCommands(testDatabaseFilePath)).toEqual(
        commands.reverse()
      );
    });
  });
});
