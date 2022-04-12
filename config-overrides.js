module.exports = function override (config, env) {
  if (env === "production") {
    //JS Overrides
    config.output.filename = 'static/js/[name].js';

    //CSS Overrides
    config.plugins[5].options.filename = 'static/css/[name].css';

    // //Media and Assets Overrides
    config.module.rules[0].oneOf[2].use[1].options.name = 'static/media/[name].[ext]';
  }

  // Resolve path
  config.resolve.fallback = {
    "path": require.resolve("path-browserify")
  };

  return config;
}
