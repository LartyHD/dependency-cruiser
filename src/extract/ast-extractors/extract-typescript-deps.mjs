/* eslint-disable no-inline-comments */
import tryImport from "semver-try-require";
import meta from "../../meta.js";

/** @type {import("typescript")} */
const typescript = await tryImport(
  "typescript",
  meta.supportedTranspilers.typescript
);

function isTypeOnly(pStatement) {
  return (
    (pStatement.importClause && pStatement.importClause.isTypeOnly) ||
    // for some reason the isTypeOnly indicator is on _statement_ level
    // and not in exportClause as it is in the importClause ¯\_ (ツ)_/¯.
    // Also in the case of the omission of an alias the exportClause
    // is not there entirely. So regardless whether there is a
    // pStatement.exportClause or not, we can directly test for the
    // isTypeOnly attribute.
    pStatement.isTypeOnly
  );
}

/*
 * Both extractImport* assume the imports/ exports can only occur at
 * top level. AFAIK this the only place they're allowed, so we should
 * be good. Otherwise we'll need to walk the tree.
 */

/**
 * Get all import and export statements from the top level AST node
 *
 * @param {import("typescript").Node} pAST - the (top-level in this case) AST node
 * @returns {{module: string; moduleSystem: string; exoticallyRequired: boolean; dependencyTypes?: string[];}[]} -
 *                                  all import and export statements in the
 *                                  (top level) AST node
 */
function extractImportsAndExports(pAST) {
  return pAST.statements
    .filter(
      (pStatement) =>
        (typescript.SyntaxKind[pStatement.kind] === "ImportDeclaration" ||
          typescript.SyntaxKind[pStatement.kind] === "ExportDeclaration") &&
        Boolean(pStatement.moduleSpecifier)
    )
    .map((pStatement) => ({
      module: pStatement.moduleSpecifier.text,
      moduleSystem: "es6",
      exoticallyRequired: false,
      ...(isTypeOnly(pStatement) ? { dependencyTypes: ["type-only"] } : {}),
    }));
}

/**
 * Get all import equals statements from the top level AST node
 *
 * E.g. import thing = require('some-thing')
 * Ignores import equals of variables (e.g. import protocol = ts.server.protocol
 * which happens in typescript/lib/protocol.d.ts)
 *
 * @param {import("typescript").Node} pAST - the (top-level in this case) AST node
 * @returns {{module: string, moduleSystem: string;exoticallyRequired: boolean;}[]} - all import equals statements in the
 *                                  (top level) AST node
 */
function extractImportEquals(pAST) {
  return pAST.statements
    .filter(
      (pStatement) =>
        typescript.SyntaxKind[pStatement.kind] === "ImportEqualsDeclaration" &&
        pStatement.moduleReference &&
        pStatement.moduleReference.expression &&
        pStatement.moduleReference.expression.text
    )
    .map((pStatement) => ({
      module: pStatement.moduleReference.expression.text,
      moduleSystem: "cjs",
      exoticallyRequired: false,
    }));
}

/**
 * might be wise to distinguish the three types of /// directive that
 * can come out of this as the resolution algorithm might differ
 *
 * @param {import("typescript").Node} pAST - typescript syntax tree
 * @returns {{module: string, moduleSystem: string}[]} - 'tripple slash' dependencies
 */
function extractTripleSlashDirectives(pAST) {
  return pAST.referencedFiles
    .map((pReference) => ({
      module: pReference.fileName,
      moduleSystem: "tsd",
      exoticallyRequired: false,
    }))
    .concat(
      pAST.typeReferenceDirectives.map((pReference) => ({
        module: pReference.fileName,
        moduleSystem: "tsd",
        exoticallyRequired: false,
      }))
    )
    .concat(
      pAST.amdDependencies.map((pReference) => ({
        module: pReference.path,
        moduleSystem: "tsd",
        exoticallyRequired: false,
      }))
    );
}

function firstArgumentIsAString(pASTNode) {
  const lFirstArgument = pASTNode.arguments[0];

  return (
    lFirstArgument &&
    // "thing" or 'thing'
    (typescript.SyntaxKind[lFirstArgument.kind] === "StringLiteral" ||
      // `thing`
      typescript.SyntaxKind[lFirstArgument.kind] === "FirstTemplateToken")
  );
}

function isRequireCallExpression(pASTNode) {
  if (
    typescript.SyntaxKind[pASTNode.kind] === "CallExpression" &&
    pASTNode.expression
  ) {
    /*
     * from typescript 5.0.0 the `originalKeywordKind` attribute is deprecated
     * and from 5.2.0 it will be gone. However, in typescript < 5.0.0 (still used
     * heavily IRL) it's the only way to get it - hence this test for the
     * existence of the * identifierToKeywordKind function to remain backwards
     * compatible
     */
    const lSyntaxKind = typescript.identifierToKeywordKind
      ? typescript.SyntaxKind[
          typescript.identifierToKeywordKind(pASTNode.expression)
        ]
      : /* c8 ignore next 1 */
        typescript.SyntaxKind[pASTNode.expression.originalKeywordKind];
    return lSyntaxKind === "RequireKeyword" && firstArgumentIsAString(pASTNode);
  }
  return false;
}

function isSingleExoticRequire(pASTNode, pString) {
  return (
    typescript.SyntaxKind[pASTNode.kind] === "CallExpression" &&
    pASTNode.expression &&
    pASTNode.expression.text === pString &&
    firstArgumentIsAString(pASTNode)
  );
}

/* eslint complexity:0 */
function isCompositeExoticRequire(pASTNode, pObjectName, pPropertyName) {
  return (
    typescript.SyntaxKind[pASTNode.kind] === "CallExpression" &&
    pASTNode.expression &&
    typescript.SyntaxKind[pASTNode.expression.kind] ===
      "PropertyAccessExpression" &&
    pASTNode.expression.expression &&
    typescript.SyntaxKind[pASTNode.expression.expression.kind] ===
      "Identifier" &&
    pASTNode.expression.expression.escapedText === pObjectName &&
    pASTNode.expression.name &&
    typescript.SyntaxKind[pASTNode.expression.name.kind] === "Identifier" &&
    pASTNode.expression.name.escapedText === pPropertyName &&
    firstArgumentIsAString(pASTNode)
  );
}

function isExoticRequire(pASTNode, pString) {
  const lRequireStringElements = pString.split(".");

  return lRequireStringElements.length > 1
    ? isCompositeExoticRequire(pASTNode, ...lRequireStringElements)
    : isSingleExoticRequire(pASTNode, pString);
}

function isDynamicImportExpression(pASTNode) {
  return (
    typescript.SyntaxKind[pASTNode.kind] === "CallExpression" &&
    pASTNode.expression &&
    typescript.SyntaxKind[pASTNode.expression.kind] === "ImportKeyword" &&
    firstArgumentIsAString(pASTNode)
  );
}

function isTypeImport(pASTNode) {
  return (
    typescript.SyntaxKind[pASTNode.kind] === "LastTypeNode" &&
    pASTNode.argument &&
    typescript.SyntaxKind[pASTNode.argument.kind] === "LiteralType" &&
    ((pASTNode.argument.literal &&
      typescript.SyntaxKind[pASTNode.argument.literal.kind] ===
        "StringLiteral") ||
      typescript.SyntaxKind[pASTNode.argument.literal.kind] ===
        "FirstTemplateToken")
  );
}
function walk(pResult, pExoticRequireStrings) {
  return (pASTNode) => {
    // require('a-string'), require(`a-template-literal`)
    if (isRequireCallExpression(pASTNode)) {
      pResult.push({
        module: pASTNode.arguments[0].text,
        moduleSystem: "cjs",
        exoticallyRequired: false,
      });
    }

    // const want = require; {lalala} = want('yudelyo'), window.require('elektron')
    pExoticRequireStrings.forEach((pExoticRequireString) => {
      if (isExoticRequire(pASTNode, pExoticRequireString)) {
        pResult.push({
          module: pASTNode.arguments[0].text,
          moduleSystem: "cjs",
          exoticallyRequired: true,
          exoticRequire: pExoticRequireString,
        });
      }
    });

    // import('a-string'), import(`a-template-literal`)
    if (isDynamicImportExpression(pASTNode)) {
      pResult.push({
        module: pASTNode.arguments[0].text,
        moduleSystem: "es6",
        dynamic: true,
        exoticallyRequired: false,
      });
    }

    // const atype: import('./types').T
    // const atype: import(`./types`).T
    if (isTypeImport(pASTNode)) {
      pResult.push({
        module: pASTNode.argument.literal.text,
        moduleSystem: "es6",
        exoticallyRequired: false,
      });
    }
    typescript.forEachChild(pASTNode, walk(pResult, pExoticRequireStrings));
  };
}

/**
 * returns an array of dependencies that come potentially nested within
 * a source file, like commonJS or dynamic imports
 *
 * @param {import("typescript").Node} pAST - typescript syntax tree
 * @returns {{module: string, moduleSystem: string}[]} - all commonJS dependencies
 */
function extractNestedDependencies(pAST, pExoticRequireStrings) {
  let lResult = [];

  walk(lResult, pExoticRequireStrings)(pAST);

  return lResult;
}

/**
 * returns all dependencies in the AST
 *
 * @type {(pTypeScriptAST: (import("typescript").Node), pExoticRequireStrings: string[]) => {module: string, moduleSystem: string, dynamic: boolean}[]}
 */
export default function extractTypeScriptDependencies(
  pTypeScriptAST,
  pExoticRequireStrings
) {
  return Boolean(typescript)
    ? extractImportsAndExports(pTypeScriptAST)
        .concat(extractImportEquals(pTypeScriptAST))
        .concat(extractTripleSlashDirectives(pTypeScriptAST))
        .concat(
          extractNestedDependencies(pTypeScriptAST, pExoticRequireStrings)
        )
        .map((pModule) => ({ dynamic: false, ...pModule }))
    : /* c8 ignore next */ [];
}
