const path = require("path");
const webpack = require("webpack");
const { merge } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
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
        clean: {
            keep: /main\.(js|js\.map)$|preload\.(js|js\.map)$/, // Keep main and preload files
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
        // Define global variables for the renderer process
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify("development"),
            global: "globalThis", // Use globalThis instead of window for better compatibility
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
        hot: false, // Disable Hot Module Replacement
        liveReload: false, // Disable live reload to avoid require issues
        open: false, // Don't open browser automatically
        allowedHosts: "all",
        headers: {
            "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss:;",
        },
        client: false, // Disable webpack-dev-server client to avoid Node.js module issues
        devMiddleware: {
            writeToDisk: true, // Write files to disk for Electron to load
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
        // Exclude Node.js modules from the bundle to prevent require errors
        fs: "commonjs fs",
        path: "commonjs path",
        events: "commonjs events",
    },
    optimization: {
        minimize: false, // Disable minification in development
        runtimeChunk: false, // Disable runtime chunk to avoid HMR issues
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
        fallback: {
            // For Electron renderer, we don't need these polyfills
            // The renderer process should use Electron's APIs through the preload script
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
