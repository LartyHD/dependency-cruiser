/* eslint-disable no-magic-numbers, no-undefined */
import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import IndexedModuleGraph from "../../src/graph-utl/indexed-module-graph.mjs";
import unIndexedModules from "./__mocks__/un-indexed-modules.mjs";
import unIndexedModulesWithoutDependents from "./__mocks__/un-indexed-modules-without-dependents.mjs";
import cycleInputGraphs from "./__mocks__/cycle-input-graphs.mjs";

describe("[U] graph-utl/indexed-module-graph - findModuleByName", () => {
  it("searching any module in an empty graph yields undefined", () => {
    const graph = new IndexedModuleGraph([]);

    strictEqual(graph.findModuleByName("any-name"), undefined);
  });

  it("searching a non-exiting module in a real graph yields undefined", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);

    strictEqual(graph.findModuleByName("any-name"), undefined);
  });

  it("searching for an existing module yields that module", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(graph.findModuleByName("src/report/dot/default-theme.js"), {
      source: "src/report/dot/default-theme.js",
      dependencies: [],
      dependents: ["src/report/dot/theming.js"],
      orphan: false,
      reachable: [
        {
          value: true,
          asDefinedInRule: "not-reachable-from-folder-index",
          matchedFrom: "src/report/index.js",
        },
      ],
      valid: true,
    });
  });
});

describe("[U] graph-utl/indexed-module-graph - findTransitiveDependents", () => {
  it("returns an empty array when asking for a non-existing module", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(
      graph.findTransitiveDependents("this-module-does-not-exist.mjs"),
      []
    );
  });

  it("returns just the module itself when the 'dependents' de-normalized attribute isn't in the graph", () => {
    const graph = new IndexedModuleGraph(unIndexedModulesWithoutDependents);
    deepStrictEqual(
      graph.findTransitiveDependents("src/report/dot/default-theme.js"),
      ["src/report/dot/default-theme.js"]
    );
  });

  it("finds just the module itself when there's no transitive dependents", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(graph.findTransitiveDependents("src/report/index.js"), [
      "src/report/index.js",
    ]);
  });

  it("finds transitive dependents for an existing module with actual transitive dependents", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(
      graph.findTransitiveDependents("src/report/dot/default-theme.js"),
      [
        "src/report/dot/default-theme.js",
        "src/report/dot/theming.js",
        "src/report/dot/index.js",
        "src/report/index.js",
        "src/report/dot/module-utl.js",
        "src/report/dot/prepare-custom-level.js",
        "src/report/dot/prepare-flat-level.js",
        "src/report/dot/prepare-folder-level.js",
      ]
    );
  });

  it("same, but with a max depth of 1", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(
      graph.findTransitiveDependents("src/report/dot/default-theme.js", 1),
      ["src/report/dot/default-theme.js", "src/report/dot/theming.js"]
    );
  });

  it("same, but with a max depth of 2", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(
      graph.findTransitiveDependents("src/report/dot/default-theme.js", 2),
      [
        "src/report/dot/default-theme.js",
        "src/report/dot/theming.js",
        "src/report/dot/index.js",
        "src/report/dot/module-utl.js",
      ]
    );
  });

  it("same, but with a max depth of 3", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(
      graph.findTransitiveDependents("src/report/dot/default-theme.js", 3),
      [
        "src/report/dot/default-theme.js",
        "src/report/dot/theming.js",
        "src/report/dot/index.js",
        "src/report/index.js",
        "src/report/dot/module-utl.js",
        "src/report/dot/prepare-custom-level.js",
        "src/report/dot/prepare-flat-level.js",
        "src/report/dot/prepare-folder-level.js",
      ]
    );
  });

  it("same, but with a max depth of 4 (as there's nothing beyond depth 3 - will yield same as max depth 3", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(
      graph.findTransitiveDependents("src/report/dot/default-theme.js", 4),
      [
        "src/report/dot/default-theme.js",
        "src/report/dot/theming.js",
        "src/report/dot/index.js",
        "src/report/index.js",
        "src/report/dot/module-utl.js",
        "src/report/dot/prepare-custom-level.js",
        "src/report/dot/prepare-flat-level.js",
        "src/report/dot/prepare-folder-level.js",
      ]
    );
  });
});

describe("[U] graph-utl/indexed-module-graph - findTransitiveDependencies", () => {
  it("returns an empty array when asking for a non-existing module", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(
      graph.findTransitiveDependencies("this-module-does-not-exist.mjs"),
      []
    );
  });

  it("finds just the module itself when there's no transitive dependencies", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(
      graph.findTransitiveDependencies("src/report/dot/default-theme.js"),
      ["src/report/dot/default-theme.js"]
    );
  });

  it("finds transitive dependencies for an existing module with actual transitive dependents", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    deepStrictEqual(
      graph.findTransitiveDependencies("src/report/error-html/index.js"),
      [
        "src/report/error-html/index.js",
        "src/report/error-html/error-html.template.js",
        "src/report/error-html/utl.js",
        "src/report/utl/index.js",
      ]
    );
  });

  it("finds direct dependencies for an existing module with actual transitive dependents with pMaxDepth = 1", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);
    const lDirectDependenciesOnlyDepth = 1;

    deepStrictEqual(
      graph.findTransitiveDependencies(
        "src/report/error-html/index.js",
        lDirectDependenciesOnlyDepth
      ),
      [
        "src/report/error-html/index.js",
        "src/report/error-html/error-html.template.js",
        "src/report/error-html/utl.js",
      ]
    );
  });

  it(" ... max depth 1", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);

    deepStrictEqual(
      graph.findTransitiveDependencies("src/report/anon/index.js", 1),
      ["src/report/anon/index.js", "src/report/anon/anonymize-path.js"]
    );
  });

  it(" ... max depth 2", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);

    deepStrictEqual(
      graph.findTransitiveDependencies("src/report/anon/index.js", 2),
      [
        "src/report/anon/index.js",
        "src/report/anon/anonymize-path.js",
        "src/report/anon/anonymize-path-element.js",
      ]
    );
  });

  it(" ... max depth 3", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);

    deepStrictEqual(
      graph.findTransitiveDependencies("src/report/anon/index.js", 3),
      [
        "src/report/anon/index.js",
        "src/report/anon/anonymize-path.js",
        "src/report/anon/anonymize-path-element.js",
        "src/report/anon/random-string.js",
      ]
    );
  });

  it(" ... max depth 4 (where there's nothing beyond 3, so should yield the same as max depth 3", () => {
    const graph = new IndexedModuleGraph(unIndexedModules);

    deepStrictEqual(
      graph.findTransitiveDependencies("src/report/anon/index.js", 4),
      [
        "src/report/anon/index.js",
        "src/report/anon/anonymize-path.js",
        "src/report/anon/anonymize-path-element.js",
        "src/report/anon/random-string.js",
      ]
    );
  });
});

describe("[U] graph-utl/indexed-module-graph - getPath", () => {
  it("does not explode when passed an empty graph", () => {
    deepStrictEqual(
      new IndexedModuleGraph([]).getPath("./src/index.js", "./src/hajoo.js"),
      []
    );
  });

  it("returns [] when from is a lonely module", () => {
    const lGraph = [
      {
        source: "./src/index.js",
        dependencies: [],
      },
    ];

    deepStrictEqual(
      new IndexedModuleGraph(lGraph).getPath(
        "./src/index.js",
        "./src/hajoo.js"
      ),
      []
    );
  });

  it("returns [from, to] when from is a direct dependency of from", () => {
    const lGraph = [
      {
        source: "./src/index.js",
        dependencies: [
          {
            resolved: "./src/hajoo.js",
          },
        ],
      },
    ];

    deepStrictEqual(
      new IndexedModuleGraph(lGraph).getPath(
        "./src/index.js",
        "./src/hajoo.js"
      ),
      ["./src/index.js", "./src/hajoo.js"]
    );
  });

  it("returns [] when to == from", () => {
    const lGraph = [
      {
        source: "./src/index.js",
        dependencies: [
          {
            resolved: "./src/hajoo.js",
          },
        ],
      },
    ];

    deepStrictEqual(
      new IndexedModuleGraph(lGraph).getPath(
        "./src/index.js",
        "./src/index.js"
      ),
      []
    );
  });

  it("returns [] when to is not in dependencies of from", () => {
    const lGraph = [
      {
        source: "./src/index.js",
        dependencies: [
          {
            resolved: "./src/noooo.js",
          },
        ],
      },
    ];

    deepStrictEqual(
      new IndexedModuleGraph(lGraph).getPath(
        "./src/index.js",
        "./src/hajoo.js"
      ),
      []
    );
  });

  it("returns true when to is a dependency one removed of from", () => {
    const lGraph = [
      {
        source: "./src/index.js",
        dependencies: [
          {
            resolved: "./src/intermediate.js",
          },
        ],
      },
      {
        source: "./src/intermediate.js",
        dependencies: [
          {
            resolved: "./src/hajoo.js",
          },
        ],
      },
    ];

    deepStrictEqual(
      new IndexedModuleGraph(lGraph).getPath(
        "./src/index.js",
        "./src/hajoo.js"
      ),
      ["./src/index.js", "./src/intermediate.js", "./src/hajoo.js"]
    );
  });

  it("doesn't get dizzy when a dep is circular (did not find to)", () => {
    const lGraph = [
      {
        source: "./src/index.js",
        dependencies: [
          {
            resolved: "./src/intermediate.js",
          },
        ],
      },
      {
        source: "./src/intermediate.js",
        dependencies: [
          {
            resolved: "./src/index.js",
          },
        ],
      },
    ];

    deepStrictEqual(
      new IndexedModuleGraph(lGraph).getPath(
        "./src/index.js",
        "./src/hajoo.js"
      ),
      []
    );
  });

  it("doesn't get dizzy when a dep is circular (did find to)", () => {
    const lGraph = [
      {
        source: "./src/index.js",
        dependencies: [
          {
            resolved: "./src/intermediate.js",
          },
        ],
      },
      {
        source: "./src/intermediate.js",
        dependencies: [
          {
            resolved: "./src/index.js",
          },
          {
            resolved: "./src/hajoo.js",
          },
        ],
      },
      {
        source: "./src/hajoo.js",
        dependencies: [],
      },
    ];

    deepStrictEqual(
      new IndexedModuleGraph(lGraph).getPath(
        "./src/index.js",
        "./src/hajoo.js"
      ),
      ["./src/index.js", "./src/intermediate.js", "./src/hajoo.js"]
    );
  });
});

function getCycle(pGraph, pFrom, pToDep) {
  const lIndexedGraph = new IndexedModuleGraph(pGraph);
  return lIndexedGraph.getCycle(pFrom, pToDep, "resolved");
}

describe("[U] graph-utl/indexed-module-graph - getCycle", () => {
  it("leaves non circular dependencies alone", () => {
    deepStrictEqual(getCycle(cycleInputGraphs.A_B, "a", "b"), []);
  });
  it("detects self circular (c <-> c)", () => {
    deepStrictEqual(getCycle(cycleInputGraphs.C_C, "c", "c"), ["c", "c"]);
  });
  it("detects 1 step circular (d <-> e)", () => {
    deepStrictEqual(getCycle(cycleInputGraphs.D_E_D, "d", "e"), ["e", "d"]);
  });
  it("detects 2 step circular (q -> r -> s -> q)", () => {
    deepStrictEqual(getCycle(cycleInputGraphs.Q_R_S_Q, "q", "r"), [
      "r",
      "s",
      "q",
    ]);
    deepStrictEqual(getCycle(cycleInputGraphs.Q_R_S_Q, "r", "s"), [
      "s",
      "q",
      "r",
    ]);
    deepStrictEqual(getCycle(cycleInputGraphs.Q_R_S_Q, "s", "q"), [
      "q",
      "r",
      "s",
    ]);
  });
  it("does not get confused because another circular (t -> u -> t, t -> v)", () => {
    deepStrictEqual(getCycle(cycleInputGraphs.T_U_T_V, "t", "u"), ["u", "t"]);
    deepStrictEqual(getCycle(cycleInputGraphs.T_U_T_V, "t", "v"), []);
  });
  it("detects two circles (a -> b -> c -> a, a -> d -> e -> a)", () => {
    deepStrictEqual(getCycle(cycleInputGraphs.TWO_CIRCLES, "a", "b"), [
      "b",
      "c",
      "a",
    ]);
    deepStrictEqual(getCycle(cycleInputGraphs.TWO_CIRCLES, "b", "c"), [
      "c",
      "a",
      "b",
    ]);
    deepStrictEqual(getCycle(cycleInputGraphs.TWO_CIRCLES, "c", "a"), [
      "a",
      "b",
      "c",
    ]);
    deepStrictEqual(getCycle(cycleInputGraphs.TWO_CIRCLES, "a", "d"), [
      "d",
      "e",
      "a",
    ]);
    deepStrictEqual(getCycle(cycleInputGraphs.TWO_CIRCLES, "d", "e"), [
      "e",
      "a",
      "d",
    ]);
    deepStrictEqual(getCycle(cycleInputGraphs.TWO_CIRCLES, "e", "a"), [
      "a",
      "d",
      "e",
    ]);
  });
  it("it goes to a circle but isn't in it itself (z -> a -> b -> c -> a)", () => {
    deepStrictEqual(getCycle(cycleInputGraphs.TO_A_CIRCLE, "z", "a"), []);
  });
  it("it goes to a circle; isn't in it itself, but also to one where it is (z -> a -> b -> c -> a, c -> z)", () => {
    deepStrictEqual(
      getCycle(cycleInputGraphs.TO_A_CIRCLE_AND_IN_IT, "z", "a"),
      ["a", "b", "c", "z"]
    );
  });
  it("just returns one cycle when querying a hub node", () => {
    deepStrictEqual(getCycle(cycleInputGraphs.FLOWER, "a", "b"), ["b", "a"]);
  });
});