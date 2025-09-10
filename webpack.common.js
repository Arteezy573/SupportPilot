const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src/sources'),
      '@/components': path.resolve(__dirname, 'src/sources/renderer/components'),
      '@/hooks': path.resolve(__dirname, 'src/sources/renderer/hooks'),
      '@/types': path.resolve(__dirname, 'src/sources/types'),
      '@/styles': path.resolve(__dirname, 'src/sources/renderer/styles')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              noEmit: false
            }
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg|ico)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      }
    ]
  },
  stats: {
    errorDetails: true
  }
};
