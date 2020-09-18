const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const config = {
  entry: './src/index.tsx',
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  target: 'web',
  optimization: {
    usedExports: true,
  },
  output: {
    filename: '[name]-[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      perf_hooks: 'utils/polyfills/perf_hooks.js',
      'wasm-audio-resampler': 'utils/polyfills/empty.js',
      wrtc: 'utils/polyfills/wrtc.js',
      os: 'utils/polyfills/os.js',
      buffer_polyfill: 'utils/polyfills/buffer.js',
      stream: 'stream-browserify',
      fs: 'utils/polyfills/empty.js',
      'env-paths': 'utils/polyfills/empty.js',
      mkdirp: 'utils/polyfills/empty.js',
      crypto: 'utils/polyfills/empty.js',
      path: 'utils/polyfills/empty.js',
      child_process: 'utils/polyfills/empty.js',
      unzipper: 'utils/polyfills/empty.js',
      dgram: 'utils/polyfills/empty.js',
      'node-hue-api': 'utils/polyfills/empty.js',
      'node-dtls-client': 'utils/polyfills/empty.js',
      'castv2-client': 'utils/polyfills/empty.js',
      net: 'utils/polyfills/empty.js',
      open: 'utils/polyfills/empty.js',
    },
    modules: [
      'node_modules',
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../node_modules'),
      path.resolve(__dirname, '../app/node_modules'),
      path.resolve(__dirname, 'src'),
    ],
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /lodash$/,
      'lodash-es',
    ),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'SoundSync',
      template: 'src/index.html',
    }),
    new webpack.ProvidePlugin({
      Buffer: 'buffer_polyfill',
    }),
    new webpack.DefinePlugin({
      'process.browser': JSON.stringify(true),
      'process.env.RENDEZVOUS_SERVICE_URL': JSON.stringify(process.env.RENDEZVOUS_SERVICE_URL),
      'process.env.DEV_MODE': process.env.NODE_ENV === 'development' ? 'true' : 'false',
    }),
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'src/static', to: 'static' },
      ],
    }),
  ],
  module: {
    defaultRules: [
      {
        type: 'javascript/auto',
        resolve: {},
      },
      {
        test: /\.json$/i,
        type: 'json',
      },
    ],
    rules: [
      {
        oneOf: [
          {
            test: [/\.audioworklet\.(js|ts)$/i],
            use: [{
              loader: 'worklet-loader',
              // options: {
              //   name: '[name]-[contenthash].[ext]',
              // },
            }, {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                experimentalWatchApi: true,
              },
            }],
          },
          {
            test: [/\.tsx?$/i, /.jsx?$/i],
            use: [{
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                experimentalWatchApi: true,
              },
            }],
            exclude: /node_modules/,
          },
          {
            test: /\.s[ac]ss$/i,
            use: [
              MiniCssExtractPlugin.loader,
              // Translates CSS into CommonJS
              'css-loader',
              // Compiles Sass to CSS
              'sass-loader',
            ],
          },
          {
            test: /.css$/i,
            use: [
              MiniCssExtractPlugin.loader,
              // Translates CSS into CommonJS
              'css-loader',
            ],
          },
          {
            loader: 'file-loader',
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/, /.wasm$/],
            options: {
              name: '[name]-[contenthash].[ext]',
            },
          },
        ],
      },
    ],
  },
};

if (process.env.NODE_ENV === 'development') {
  config.devtool = 'inline-source-map';
  config.devServer = {
    contentBase: path.join(__dirname, 'dist'), // boolean | string | array, static file location
    compress: true, // enable gzip compression
    historyApiFallback: true, // true for index.html upon 404, object for multiple paths
    // hot: true, // hot module replacement. Depends on HotModuleReplacementPlugin
    overlay: true,
    host: '0.0.0.0',
    disableHostCheck: true,
  };
}

if (process.env.ANALYZE) {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  config.plugins.push(new BundleAnalyzerPlugin());
}

module.exports = config;
