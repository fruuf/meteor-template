/* global require */
const validator = require('webpack-validator');

const config = {
  entry: [
    './main',
  ],
  resolve: {
    extensions: ['', '.js', '.json'],
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel',
        exclude: /node_modules/,
      },
    ],
  },
};

module.exports = validator(config);
