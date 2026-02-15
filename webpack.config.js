const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  target: ['web', 'es5'],
  entry: './src/index.jsx',
  optimization: {
    minimize: false,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    environment: {
      arrowFunction: false,
      const: false,
      destructuring: false,
      forOf: false,
      module: false,
      optionalChaining: false,
      templateLiteral: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.m?jsx?$/,
        // Exclude from Babel:
        // - core-js: already ES5, re-processing causes infinite polyfill loops
        // - sdk/lib/cjs: already transpiled to ES5 by Rollup with its own
        //   polyfill requires; Babel "entry" mode strips them otherwise
        exclude: [/node_modules[\\/]core-js/, /node_modules[\\/]@streamlayer[\\/]web-os/],
        // exclude: [/node_modules/],
        use: {
          loader: 'babel-loader',
          options: {
            sourceType: "unambiguous",
            presets: [
              ['@babel/preset-env', {
                targets: "chrome 32",
                useBuiltIns: "entry",
                corejs: 3
              }],
              ['@babel/preset-react', { runtime: "classic" }]
            ]
          }
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    // Exclude "module" and "import" conditions so webpack resolves the "require"
    // (CJS) entry from package.json "exports" maps. Without this, webpack picks
    // the "module" condition → lib/es/ builds that contain un-transpiled ES6+.
    conditionNames: ['webpack', 'require', 'browser', 'default'],
    alias: {
      // Force CJS entry so webpack doesn't pick the "browser" field
      // (webcrypto-liner.shim.mjs), which is an IIFE expecting globals
      // and contains un-transpiled ES6+ that babel-loader skips for .mjs
      'webcrypto-liner': path.resolve(__dirname, 'node_modules/webcrypto-liner/build/index.js'),
    },
    fallback: {
      // webcrypto-core tries require('crypto') (Node built-in);
      // not needed in browser — the liner provides its own SubtleCrypto
      crypto: false,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
  ],
  devServer: {
    port: 3000,
    hot: false,
    client: false,
  },
};
