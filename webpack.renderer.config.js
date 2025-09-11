const path = require("path");
const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    target: "electron-renderer",
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
    ],
    externals: {
        electron: "commonjs electron",
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
