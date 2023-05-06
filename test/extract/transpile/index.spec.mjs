import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import transpile, {
  getWrapper,
} from "../../../src/extract/transpile/index.mjs";
import normalizeSource from "../normalize-source.utl.mjs";

import jsWrap from "../../../src/extract/transpile/javascript-wrap.mjs";
import lsWrap from "../../../src/extract/transpile/livescript-wrap.mjs";
import babelWrap from "../../../src/extract/transpile/babel-wrap.mjs";
import vueTemplateWrap from "../../../src/extract/transpile/vue-template-wrap.cjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe("[I] transpile", () => {
  it("As the 'livescript' transpiler is not available, returns the original source", async () => {
    expect(
      await transpile({ extension: ".ls", source: "whatever the bever" })
    ).to.equal("whatever the bever");
  });

  it("As the 'bf-script' transpiler is not supported at all, returns the original source", async () => {
    expect(
      await transpile({
        extension: ".bfs",
        source: "'brane-fuchs-skrybd'|#$'nicht unterstutzt'|^^^",
      })
    ).to.equal("'brane-fuchs-skrybd'|#$'nicht unterstutzt'|^^^");
  });

  it("Returns svelte compiled down to js", async () => {
    const lInput = readFileSync(
      join(__dirname, "__mocks__", "svelte-ts.svelte"),
      "utf8"
    );
    const lExpectedOoutput = normalizeSource(
      readFileSync(join(__dirname, "__fixtures__", "svelte.js"), "utf8")
    );

    expect(
      normalizeSource(await transpile({ extension: ".svelte", source: lInput }))
    ).to.equal(lExpectedOoutput);
  });

  it("Does not confuse .ts for .tsx", async () => {
    const lInputFixture = readFileSync(
      join(__dirname, "__mocks__/dontconfuse_ts_for_tsx/input/Observable.ts"),
      "utf8"
    );
    const lTranspiledFixture = readFileSync(
      join(
        __dirname,
        "__mocks__/dontconfuse_ts_for_tsx/transpiled/Observable.js"
      ),
      "utf8"
    );

    expect(
      normalizeSource(
        await transpile({ extension: ".ts", source: lInputFixture })
      )
    ).to.equal(normalizeSource(lTranspiledFixture));
  });

  it("Takes a tsconfig and takes that into account on transpilation", async () => {
    const lInputFixture = readFileSync(
      join(__dirname, "__mocks__/dontconfuse_ts_for_tsx/input/Observable.ts"),
      "utf8"
    );
    const lTranspiledFixture = readFileSync(
      join(
        __dirname,
        "__mocks__/dontconfuse_ts_for_tsx/transpiled/Observable.js"
      ),
      "utf8"
    );

    const lTranspilerOptions = {
      baseUrl: "src",
      paths: {
        "@core/*": ["core/*"],
      },
      rootDirs: ["shared", "hello"],
      typeRoots: ["../../types"],
      types: ["foo", "bar", "baz"],
    };
    expect(
      normalizeSource(
        await transpile(
          { extension: ".ts", source: lInputFixture },
          lTranspilerOptions
        )
      )
    ).to.equal(lTranspiledFixture);
  });
});

describe("[I] transpile/wrapper", () => {
  it("returns the 'js' wrapper for unknown extensions", () => {
    expect(getWrapper("")).to.deep.equal(jsWrap);
  });

  it("returns the 'ls' wrapper for livescript", () => {
    expect(getWrapper(".ls")).to.deep.equal(lsWrap);
  });

  it("returns the 'javascript' wrapper for javascript when the babel config is not passed", () => {
    expect(getWrapper(".js", {})).to.deep.equal(jsWrap);
  });

  it("returns the 'javascript' wrapper for javascript when there's just a typscript config", () => {
    expect(getWrapper(".js", { tsConfig: {} })).to.deep.equal(jsWrap);
  });

  it("returns the 'babel' wrapper for javascript when the babel config is empty", () => {
    expect(getWrapper(".js", { babelConfig: {} })).to.deep.equal(jsWrap);
  });

  it("returns the 'babel' wrapper for javascript when the babel config is not empty", () => {
    expect(
      getWrapper(".js", { babelConfig: { babelrc: false } })
    ).to.deep.equal(babelWrap);
  });

  it("returns the 'babel' wrapper for typescript when the babel config is not empty", () => {
    expect(
      getWrapper(".ts", { babelConfig: { babelrc: false } })
    ).to.deep.equal(babelWrap);
  });

  it("returns the 'vue' wrapper for vue templates even when the babel config is not empty", () => {
    expect(
      getWrapper(".vue", { babelConfig: { babelrc: false } })
    ).to.deep.equal(vueTemplateWrap);
  });

  it("returns the 'svelte' wrapper for svelte even when the babel config is not empty", () => {
    expect(
      getWrapper(".svelte", {
        babelConfig: { babelrc: false },
      })
        .transpile("")
        .toString()
    ).to.contain("generated by Svelte");
  });
});
