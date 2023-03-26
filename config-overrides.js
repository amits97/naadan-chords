const appConfig = require("./src/config");

module.exports = function override(config, env) {
  if (env === "production") {
    //JS Overrides
    config.output.filename = "static/js/[name].js";

    //CSS Overrides
    config.plugins.forEach((plugin, index) => {
      if (plugin.constructor.name === "MiniCssExtractPlugin") {
        config.plugins[index].options.filename = "static/css/[name].css";
      }
    });

    // //Media and Assets Overrides
    config.module.rules[0].oneOf[2].use[1].options.name =
      "static/media/[name].[ext]";
  }

  // Resolve path
  config.resolve.fallback = {
    path: require.resolve("path-browserify"),
  };

  // Add noAds variable
  config.plugins.forEach((plugin, index) => {
    if (plugin.constructor.name === "HtmlWebpackPlugin") {
      config.plugins[index].userOptions.noAds = appConfig.noAds;
    }
  });

  return config;
};
