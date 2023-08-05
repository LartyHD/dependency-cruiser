/* eslint-disable no-magic-numbers */
import { strictEqual } from "node:assert";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import format from "../../src/cli/format.mjs";
import deleteDammit from "./delete-dammit.utl.cjs";

function relative(pFileName) {
  return fileURLToPath(new URL(pFileName, import.meta.url));
}
describe("[E] cli/format", () => {
  it("formats a cruise result and writes it to file", async () => {
    const lOutFile = "thing";

    deleteDammit(lOutFile);

    const lExitCode = await format(relative("__fixtures__/empty.json"), {
      outputTo: lOutFile,
    });

    strictEqual(
      readFileSync(lOutFile, "utf8").includes("dependencies cruised"),
      true
    );
    strictEqual(lExitCode, 0);
    deleteDammit(lOutFile);
  });

  it("formats a cruise result, --focus filter works and writes it to a file", async () => {
    const lOutFile = "thing.json";

    deleteDammit(lOutFile);

    const lExitCode = await format(
      relative("__fixtures__/result-has-a-dependency-violation.json"),
      {
        outputTo: lOutFile,
        outputType: "json",
        focus: "^src/main",
      }
    );
    const lResult = JSON.parse(readFileSync(lOutFile, "utf8"));
    strictEqual(lResult.summary.error, 0);
    strictEqual(lResult.summary.totalCruised < 175, true);
    strictEqual(lResult.summary.totalDependenciesCruised < 298, true);
    strictEqual(lResult.summary.violations.length, 1);
    strictEqual(
      lResult.modules
        .map((pModule) => pModule.source)
        .includes("bin/depcruise-fmt.mjs"),
      false
    );
    strictEqual(
      lResult.modules
        .map((pModule) => pModule.source)
        .includes("src/main/index.js"),
      true
    );
    strictEqual(
      lResult.modules
        .map((pModule) => pModule.source)
        .includes("src/cli/index.js"),
      true
    );
    strictEqual(
      lResult.modules
        .map((pModule) => pModule.source)
        .includes("src/cli/init-config/index.js"),
      false
    );
    strictEqual(lExitCode, 0);
    deleteDammit(lOutFile);
  });

  it("formats a cruise result --prefix is reflected into the summary", async () => {
    const lOutFile = "thing.json";
    const lAlternatePrefix = "http://localhost:2022/";

    deleteDammit(lOutFile);

    await format(
      relative("__fixtures__/result-has-a-dependency-violation.json"),
      {
        outputTo: lOutFile,
        outputType: "json",
        prefix: lAlternatePrefix,
      }
    );
    const lResult = JSON.parse(readFileSync(lOutFile, "utf8"));

    strictEqual(lResult.summary.optionsUsed.prefix, lAlternatePrefix);

    deleteDammit(lOutFile);
  });

  it("returns a non-zero exit code when there's error level dependency violations in the output (regardless the value of exitCode)", async () => {
    const lOutFile = "otherthing";

    deleteDammit(lOutFile);

    const lExitCode = await format(
      relative("__fixtures__/result-has-a-dependency-violation.json"),
      {
        outputTo: lOutFile,
      }
    );

    strictEqual(lExitCode, 2);
    deleteDammit(lOutFile);
  });
});