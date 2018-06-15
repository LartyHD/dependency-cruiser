function pryConfigFromTheConfig(pWebpackConfigModule, pEnvironment, pArguments){
    let lRetval = pWebpackConfigModule;

    if (typeof pWebpackConfigModule === 'function'){
        lRetval = pWebpackConfigModule(pEnvironment, pArguments);
    }

    if (Array.isArray(pWebpackConfigModule)){
        lRetval = pWebpackConfigModule[0];
    }

    return lRetval;
}

module.exports = (pWebpackConfigFilename, pEnvironment, pArguments) => {
    let lRetval = {};

    try {
        /* eslint global-require:0, security/detect-non-literal-require:0, import/no-dynamic-require:0 */
        const lWebpackConfigModule = require(pWebpackConfigFilename);
        const lWebpackConfig = pryConfigFromTheConfig(lWebpackConfigModule, pEnvironment, pArguments);

        if (lWebpackConfig.resolve){
            lRetval = lWebpackConfig.resolve;
        }
    } catch (pError){
        throw new Error(
            `The webpack config '${pWebpackConfigFilename}' seems to be not quite valid for use:` +
            `\n\n          "${pError}"\n`
        );
    }

    return lRetval;
};