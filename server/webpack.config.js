/* global require */
const validator = require('webpack-validator');

const config = {
  entry: [
    'react-hot-loader/patch',
    './main'
  ],
  resolve: {
    extensions: ['', '.js', '.json', '.scss'],
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel',
        exclude: /node_modules/,
      }, {
        test: /\.scss$/,
        loaders: ['style', 'css', 'sass'],
      },
    ],
  },
};

module.exports = validator(config);
