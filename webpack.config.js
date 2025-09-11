const mainConfig = require("./webpack.main.config.js");
const rendererConfig = require("./webpack.renderer.config.js");
const preloadConfig = require("./webpack.preload.config.js");

module.exports = [mainConfig, preloadConfig, rendererConfig];
