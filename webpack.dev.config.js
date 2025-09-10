const path = require('path');
const { merge } = require('webpack-merge');
const rendererConfig = require('./webpack.renderer.config.js');

module.exports = merge(rendererConfig, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true,
    port: 9000,
    hot: true,
    open: false,
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;"
    }
  },
  optimization: {
    minimize: false
  }
});
