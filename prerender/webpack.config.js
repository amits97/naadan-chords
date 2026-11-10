const slsw = require("serverless-webpack");
const nodeExternals = require("webpack-node-externals");

const ESM_ONLY_MODULES = ["@sparticuz/chromium", "puppeteer-core"];

const externalType = (name) =>
  ESM_ONLY_MODULES.includes(name) ? `import ${name}` : `commonjs ${name}`;

module.exports = {
  entry: slsw.lib.entries,
  target: "node22",
  // Generate sourcemaps for proper error messages
  devtool: 'source-map',
  // Since 'aws-sdk' is not compatible with webpack,
  // we exclude all node dependencies
  externals: [nodeExternals({ importType: externalType })],
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  optimization: {
    // We do not want to minimize our code.
    minimize: false
  },
  performance: {
    // Turn off size warnings for entry points
    hints: false
  },
  // Run babel on all .js files and skip those in node_modules
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        include: __dirname,
        exclude: /node_modules/
      }
    ]
  }
};

