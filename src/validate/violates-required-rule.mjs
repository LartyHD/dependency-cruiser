import { extractGroups } from "../utl/regex-util.mjs";
import matchers from "./matchers.mjs";

/**
 * Returns true if the module violates the rule.
 * Returns false in all other cases.
 *
 * @param {import("../../types/rule-set.js").IRequiredRuleType} pRule
 * @param {import("../../types/cruise-result.js").IModule} pModule
 * @returns {boolean}
 */
export default function violatesRequiredRule(pRule, pModule) {
  let lReturnValue = false;

  if (
    matchers.modulePath(pRule, pModule) &&
    matchers.modulePathNot(pRule, pModule)
  ) {
    const lGroups = extractGroups(pRule.module, pModule.source);

    lReturnValue = !pModule.dependencies.some((pDependency) =>
      matchers.toPath(pRule, pDependency, lGroups)
    );
  }
  return lReturnValue;
}
