const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    target: "electron-preload",
    devtool: process.env.NODE_ENV === "development" ? "inline-source-map" : "source-map",
    entry: {
        preload: "./src/sources/preload.ts",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
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
