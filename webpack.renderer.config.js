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
        // Provide polyfills for Node.js modules needed by some packages
        new webpack.ProvidePlugin({
            process: "process/browser",
            Buffer: ["buffer", "Buffer"],
        }),
    ],
    externals: {
        electron: "commonjs electron",
    },
    resolve: {
        fallback: process.env.NODE_ENV === "development" ? {
            // Provide polyfills for Node.js core modules in development
            events: require.resolve("events/"),
            fs: false,
            path: require.resolve("path-browserify"),
            crypto: require.resolve("crypto-browserify"),
            stream: require.resolve("stream-browserify"),
            util: require.resolve("util/"),
            buffer: require.resolve("buffer/"),
            process: require.resolve("process/browser"),
            url: require.resolve("url/"),
            querystring: require.resolve("querystring-es3"),
            os: require.resolve("os-browserify/browser"),
        } : {
            // Disable Node.js core modules for browser compatibility in production
            fs: false,
            path: false,
            crypto: false,
            stream: false,
            util: false,
            buffer: false,
            process: false,
            events: false,
            url: false,
            querystring: false,
            os: false,
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
