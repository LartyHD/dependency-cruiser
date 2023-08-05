import { deepStrictEqual } from "node:assert";
import { describe, it } from "node:test";
import moduleUtl from "../../../src/report/dot/module-utl.mjs";

describe("[U] report/dot/module-utl", () => {
  it("extractFirstTransgression - keeps as is when there's no transgressions", () => {
    deepStrictEqual(moduleUtl.extractFirstTransgression({ dependencies: [] }), {
      dependencies: [],
    });
  });

  it("extractFirstTransgression - adds the first module rule if there's at least one", () => {
    deepStrictEqual(
      moduleUtl.extractFirstTransgression({
        dependencies: [],
        rules: [
          { name: "error-thing", severity: "error" },
          { name: "warn-thing", severity: "warn" },
        ],
      }),
      {
        dependencies: [],
        tooltip: "error-thing",
        rules: [
          { name: "error-thing", severity: "error" },
          { name: "warn-thing", severity: "warn" },
        ],
      }
    );
  });

  it("extractFirstTransgression - adds the first dependency rule if there's at least one", () => {
    deepStrictEqual(
      moduleUtl.extractFirstTransgression({
        dependencies: [
          {
            rules: [
              { name: "error-thing", severity: "error" },
              { name: "warn-thing", severity: "warn" },
            ],
          },
        ],
      }),
      {
        dependencies: [
          {
            rule: { name: "error-thing", severity: "error" },
            rules: [
              { name: "error-thing", severity: "error" },
              { name: "warn-thing", severity: "warn" },
            ],
          },
        ],
      }
    );
  });

  it("flatLabel - returns the value of source as label", () => {
    deepStrictEqual(
      moduleUtl.flatLabel(true)({ source: "aap/noot/mies/wim/zus.jet" }),
      {
        source: "aap/noot/mies/wim/zus.jet",
        label: "<aap/noot/mies/wim/<BR/><B>zus.jet</B>>",
        tooltip: "zus.jet",
      }
    );
  });

  it("flatLabel - returns the value of source & instability metric as label when instability is known", () => {
    deepStrictEqual(
      moduleUtl.flatLabel(true)({
        source: "aap/noot/mies/wim/zus.jet",
        instability: "0.481",
      }),
      {
        source: "aap/noot/mies/wim/zus.jet",
        label: `<aap/noot/mies/wim/<BR/><B>zus.jet</B> <FONT color="#808080" point-size="8">48%</FONT>>`,
        tooltip: "zus.jet",
        instability: "0.481",
      }
    );
  });

  it("flatLabel - returns the value of source when instability is known, but showMetrics is false", () => {
    deepStrictEqual(
      moduleUtl.flatLabel(false)({
        source: "aap/noot/mies/wim/zus.jet",
        instability: "0.481",
      }),
      {
        source: "aap/noot/mies/wim/zus.jet",
        label: `<aap/noot/mies/wim/<BR/><B>zus.jet</B>>`,
        tooltip: "zus.jet",
        instability: "0.481",
      }
    );
  });
});