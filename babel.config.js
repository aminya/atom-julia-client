let presets = [
  "@babel/preset-react",
  ["@babel/preset-env", {
    targets: {
      "electron": 5
    }
  }]
];

let plugins =  [
  "@babel/plugin-proposal-optional-chaining",
  "@babel/plugin-syntax-dynamic-import",
  "@babel/plugin-proposal-class-properties",
  "babel-plugin-transform-export-extensions",
  "@babel/plugin-transform-modules-commonjs"
];

module.exports = {
  presets: presets,
  plugins: plugins,
  exclude: "node_modules/**",
  // runtimeHelpers: true,
}
