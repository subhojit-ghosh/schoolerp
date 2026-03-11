const path = require("node:path");
const nodeExternals = require("webpack-node-externals");

module.exports = (options) => ({
  ...options,
  devtool: "source-map",
  output: {
    ...options.output,
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  externals: [
    nodeExternals({
      allowlist: [/^@academic-platform\//],
    }),
  ],
  module: {
    ...options.module,
    rules: [
      {
        test: /\.ts$/,
        exclude: [/\.d\.ts$/, /node_modules/],
        use: {
          loader: "swc-loader",
          options: {
            sourceMaps: true,
            module: {
              type: "commonjs",
            },
            jsc: {
              target: "es2022",
              parser: {
                syntax: "typescript",
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
              },
            },
          },
        },
      },
    ],
  },
  resolve: {
    ...options.resolve,
    extensions: [".ts", ".js", ...(options.resolve?.extensions ?? [])],
  },
});
