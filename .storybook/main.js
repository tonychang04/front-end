const webpack = require('webpack');
const path = require('path');
const svgoConfig = require('../common/config/svgo');
// const postCSSConfig = require('../postcss.config');

// Export a function. Accept the base config as the only param.
module.exports = {
  stories: ['../components/**/__stories__/*.stories.js'],
  addons: [
    '@storybook/addon-essentials',
    // TODO: Use for storybook@^6.2.0
    // {
    //   name: '@storybook/addon-postcss',
    //   options: {
    //     cssLoaderOptions: {
    //       sourceMap: true,
    //       modules: {
    //         localIdentName: '[name]_[local]__[hash:base64:5]',
    //       },
    //     },
    //     postcssLoaderOptions: {
    //       implementation: require('postcss'),
    //       postcssOptions: {
    //         config: path.resolve(__dirname, '../postcss.config.js'),
    //       },
    //     },
    //   },
    // },
  ],
  webpackFinal: async (config, { configType }) => {
    // 'configType' has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    config.node = { fs: 'empty' };

    config.resolve.extensions.push('.svg');

    config.module.rules = config.module.rules.map(data => {
      if (/svg\|/.test(String(data.test)))
        data.test = /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani)(\?.*)?$/;
      return data;
    });

    // remove existing css-loader rules
    config.module.rules = config.module.rules.filter(f => f.test.toString() !== '/\\.css$/');

    // extend config to our liking
    config.module.rules.push(
      {
        test: /\.css$/,
        loaders: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
              modules: {
                localIdentName: '[name]_[local]__[hash:base64:5]',
              },
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: [
                // Use PostCSS.config.js, but also use `postcss-export-custom-variables` plugin
                require('postcss-prepend-imports')({
                  path: 'common/styles',
                  files: ['media-queries.css'],
                }),
                require('postcss-import'),
                require('autoprefixer'),
                require('postcss-custom-media'),
                require('postcss-custom-properties')({
                  importFrom: './common/styles/variables.css',
                  preserve: true,
                }),
                require('postcss-export-custom-variables')({
                  exporter: 'js',
                  destination: './common/styles/themeMap.js',
                }),
              ],
            },
          },
        ],
        include: path.resolve(__dirname, '../'),
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgo: svgoConfig,
            },
          },
        ],
      },
    );

    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.__NEXT_IMAGE_OPTS': JSON.stringify({
          deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
          imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
          domains: [],
          path: '/',
          loader: 'default',
        }),
      }),
    );

    return config;
  },
};
