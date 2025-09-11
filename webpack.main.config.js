const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    target: "electron-main",
    devtool: process.env.NODE_ENV === "development" ? "inline-source-map" : "source-map",
    entry: {
        main: "./src/sources/main.ts",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        clean: {
            keep: /^(?!main\.)/,  // Keep everything except main.js files when cleaning
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: "tsconfig.main.json",
                        transpileOnly: true,
                        compilerOptions: {
                            noEmit: false,
                        },
                    },
                },
            },
        ],
    },
    node: {
        __dirname: false,
        __filename: false,
    },
    externals: {
        electron: "commonjs electron",
    },
    optimization: {
        minimize: false,
    },
});
