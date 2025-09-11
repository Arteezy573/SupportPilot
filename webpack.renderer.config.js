const path = require("path");
const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    target: "electron-renderer",
    devtool: process.env.NODE_ENV === "development" ? "inline-source-map" : "source-map",
    entry: {
        renderer: "./src/sources/renderer/index.tsx",
    },
    output: {
        path: path.resolve(__dirname, "dist/renderer"),
        filename: "[name].js",
        publicPath: "./",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: "tsconfig.renderer.json",
                        transpileOnly: true,
                        compilerOptions: {
                            noEmit: false,
                        },
                    },
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/sources/renderer/index.html",
            filename: "index.html",
            chunks: ["renderer"],
            inject: "body",
        }),
        // Define global variables for the renderer process
        new webpack.DefinePlugin({
            // Provide a mock process object with minimal properties
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
            // Define global as window
            global: "window",
        }),
    ],
    externals: {
        electron: "commonjs electron",
    },
    resolve: {
        fallback: {
            // Disable Node.js core modules for browser compatibility
            fs: false,
            path: false,
            crypto: false,
            stream: false,
            util: false,
            buffer: false,
            process: false,
        },
    },
    optimization: {
        splitChunks: {
            chunks: "all",
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendors",
                    chunks: "all",
                },
            },
        },
    },
});
