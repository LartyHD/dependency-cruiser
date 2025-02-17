import { deepEqual } from "node:assert/strict";
import extract from "../../src/extract/index.mjs";
import { normalizeCruiseOptions } from "../../src/main/options/normalize.mjs";
import normalizeResolveOptions from "../../src/main/resolve-options/normalize.mjs";
import { createRequireJSON } from "../backwards.utl.mjs";

const requireJSON = createRequireJSON(import.meta.url);

describe("[I] extract/index - exclude", () => {
  it("exclude - exclude.path", async () => {
    const lOptions = normalizeCruiseOptions({
      exclude: {
        path: "dynamic-to-circular",
      },
    });
    const lResolveOptions = await normalizeResolveOptions(
      {
        bustTheCache: true,
      },
      lOptions,
    );
    const lResult = extract(
      ["./test/extract/__mocks__/exclude/path/es/src"],
      lOptions,
      lResolveOptions,
    );

    deepEqual(lResult, requireJSON("./__mocks__/exclude/path/es/output.json"));
  });

  it("exclude - exclude.dynamic", async () => {
    const lOptions = normalizeCruiseOptions({
      exclude: {
        dynamic: true,
      },
    });
    const lResolveOptions = await normalizeResolveOptions(
      {
        bustTheCache: true,
      },
      lOptions,
    );
    const lResult = extract(
      ["./test/extract/__mocks__/exclude/dynamic/es/src"],
      lOptions,
      lResolveOptions,
    );

    deepEqual(
      lResult,
      requireJSON("./__mocks__/exclude/dynamic/es/output.json"),
    );
  });
});

/* eslint node/global-require: 0*/
