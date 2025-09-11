const path = require("path");
const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    mode: "development",
    target: "electron-renderer",
    devtool: "inline-source-map", // Better for Electron debugging
    entry: {
        renderer: "./src/sources/renderer/index.tsx",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        publicPath: "/",
        clean: true,
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
                        transpileOnly: true, // Speed up compilation in development
                        compilerOptions: {
                            noEmit: false,
                        },
                    },
                },
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: "asset/resource",
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: "asset/resource",
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/sources/renderer/index.html",
            filename: "index.html",
            chunks: ["renderer"],
            inject: "body",
            minify: false, // Disable minification in development
        }),
        new ReactRefreshWebpackPlugin({
            overlay: false, // Disable overlay for Electron
            exclude: [/node_modules/, /\.test\./],
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, "dist"),
            publicPath: "/",
        },
        compress: true,
        port: 9000,
        host: "127.0.0.1", // Use IPv4 instead of localhost to avoid IPv6 binding
        hot: true, // Enable Hot Module Replacement
        liveReload: true, // Enable live reload as fallback
        open: false, // Don't open browser automatically
        allowedHosts: "all",
        headers: {
            "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss:;",
        },
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
            progress: true,
            reconnect: 5,
        },
        devMiddleware: {
            writeToDisk: false, // Keep files in memory for faster reload
        },
        // Ensure source maps are properly served
        setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
                throw new Error('webpack-dev-server is not defined');
            }
            
            // Add middleware to serve source maps with correct headers
            devServer.app.use('*.map', (req, res, next) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                next();
            });
            
            return middlewares;
        },
        watchFiles: {
            paths: ["src/**/*"],
            options: {
                usePolling: false, // Use native file watching
            },
        },
    },
    externals: {
        electron: "commonjs electron",
    },
    optimization: {
        minimize: false, // Disable minification in development
        runtimeChunk: "single", // Enable runtime chunk for better HMR
        splitChunks: {
            chunks: "all",
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendors",
                    chunks: "all",
                    priority: 10,
                },
                common: {
                    name: "common",
                    minChunks: 2,
                    chunks: "all",
                    priority: 5,
                    reuseExistingChunk: true,
                },
            },
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src/sources"),
        },
        extensions: [".tsx", ".ts", ".js", ".jsx"],
    },
    stats: {
        colors: true,
        chunks: false,
        children: false,
        modules: false,
        entrypoints: false,
        errorDetails: true,
        warnings: true,
    },
});
