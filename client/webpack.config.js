/* global require */
const validator = require('webpack-validator');

const config = {
  entry: [
    'react-hot-loader/patch',
    './main',
  ],
  resolve: {
    extensions: ['', '.js', '.json', '.scss', '.css'],
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel',
        exclude: /node_modules/,
      }, {
        test: /\.(scss|css)$/,
        loaders: ['style', 'css', 'sass'],
      }, {
        test: /\.(jpg|png|woff|ttf|eot|woff2|svg)$/,
        loader: 'url?limit=25000',
      },
    ],
  },
};

module.exports = validator(config);
