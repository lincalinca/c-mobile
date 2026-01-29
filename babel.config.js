module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@components": "./components",
            "@constants": "./constants",
            "@lib": "./lib",
            "@app": "./app",
            "@db": "./db",
            "@assets": "./assets",
            "@public": "./public",
          },
        },
      ],
      // reanimated must be last
      "react-native-reanimated/plugin",
    ],
  };
};

