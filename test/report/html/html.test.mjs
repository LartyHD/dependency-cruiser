import { deepStrictEqual, strictEqual } from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import render from "../../../src/report/html/index.mjs";
import deps from "./__mocks__/cjs-no-dependency-valid.mjs";

const elementFixture = readFileSync(
  fileURLToPath(
    new URL("__mocks__/cjs-no-dependency-valid.html", import.meta.url)
  ),
  "utf8"
);

describe("[I] report/html reporter", () => {
  it("renders html - modules in the root don't come in a cluster; and one module could not be resolved", () => {
    const lReturnValue = render(deps);

    deepStrictEqual(lReturnValue.output, elementFixture);
    strictEqual(lReturnValue.exitCode, 0);
  });
});