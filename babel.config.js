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
            "@hooks": "./hooks",
            "@assets": "./assets",
            "@public": "./public",
            "@root": "./",
          },
        },
      ],
      // reanimated must be last
      "react-native-reanimated/plugin",
    ],
  };
};

