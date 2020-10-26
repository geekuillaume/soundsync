/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

const config = {
  entry: './src/index.tsx',
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  target: ['web', 'es2020'],
  optimization: {
    usedExports: true,
  },
  output: {
    filename: '[name]-[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
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
      'posthog-node': false,
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
    new PreloadWebpackPlugin({
      rel: 'preload',
      include: 'allAssets',
      fileBlacklist: [/\.(png|ico|svg|jpg|js|json|woff|txt|wasm|br|gz|map)$/],
    }),
    new webpack.ProvidePlugin({
      Buffer: 'buffer_polyfill',
    }),
    new webpack.DefinePlugin({
      'process.browser': JSON.stringify(true),
      'process.env': JSON.stringify({
        RENDEZVOUS_SERVICE_URL: process.env.RENDEZVOUS_SERVICE_URL,
        DEV_MODE: process.env.NODE_ENV === 'development',
        NODE_ENV: process.env.NODE_ENV || 'development',
      }),
      'process.stdout': 'null',
      'process.stderr': 'null',
    }),
    new MiniCssExtractPlugin({
      filename: '[name]-[contenthash].css',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/static', to: 'static' },
      ],
    }),
    new webpack.ProgressPlugin({ percentBy: 'entries' }),
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
  cache: {
    // 1. Set cache type to filesystem
    type: 'filesystem',

    buildDependencies: {
      // 2. Add your config as buildDependency to get cache invalidation on config change
      config: [__filename],

      // 3. If you have other things the build depends on you can add them here
      // Note that webpack, loaders and all modules referenced from your config are automatically added
    },
  },
};

if (process.env.NODE_ENV === 'development') {
  config.devtool = 'inline-source-map';
  config.devServer = {
    contentBase: path.join(__dirname, 'dist'), // boolean | string | array, static file location
    compress: true, // enable gzip compression
    historyApiFallback: true, // true for index.html upon 404, object for multiple paths
    overlay: true,
    host: '0.0.0.0',
    disableHostCheck: true,
  };
}

if (config.mode === 'production') {
  config.devtool = 'source-map';
  config.plugins.push(new CompressionPlugin());
  config.plugins.push(new CompressionPlugin({
    filename: '[path][base].br',
    algorithm: 'brotliCompress',
    compressionOptions: {
      level: 11,
    },
  }));
}

if (process.env.ANALYZE) {
  const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  config.plugins.push(new BundleAnalyzerPlugin());
}

if (process.env.SENTRY_AUTH_TOKEN && process.env.NODE_ENV === 'production') {
  config.plugins.push(new SentryWebpackPlugin({
    // sentry-cli configuration
    authToken: process.env.SENTRY_AUTH_TOKEN,
    org: 'soundsync',
    project: 'soundsync-desktop',

    // webpack specific configuration
    include: '.',
    ignore: ['node_modules', 'webpack.config.js'],
  }));
}

module.exports = config;
