import { deepStrictEqual } from "node:assert";
import { describe, it } from "node:test";
import validate from "../../src/validate/index.mjs";
import parseRuleSet from "./parse-ruleset.utl.mjs";

describe("[I] validate/index - preCompilationOnly", () => {
  const lPreCompilationOnlyRuleSet = parseRuleSet({
    forbidden: [
      {
        name: "precomp",
        from: {},
        to: {
          preCompilationOnly: true,
        },
      },
    ],
  });
  it("Stuff that still exists after compilation - okeleedokelee", () => {
    deepStrictEqual(
      validate.dependency(
        lPreCompilationOnlyRuleSet,
        { source: "something" },
        { resolved: "real-stuff-only.ts", preCompilationOnly: false }
      ),
      { valid: true }
    );
  });

  it("Stuff that only exists before compilation - flaggeleedaggelee", () => {
    deepStrictEqual(
      validate.dependency(
        lPreCompilationOnlyRuleSet,
        { source: "something" },
        { resolved: "types.d.ts", preCompilationOnly: true }
      ),
      {
        rules: [{ name: "precomp", severity: "warn" }],
        valid: false,
      }
    );
  });

  it("Unknown whether stuff that only exists before compilation - okeleedokelee", () => {
    deepStrictEqual(
      validate.dependency(
        lPreCompilationOnlyRuleSet,
        { source: "something" },
        { resolved: "types.d.ts" }
      ),
      { valid: true }
    );
  });
});