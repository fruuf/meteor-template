/* global require */
const validator = require('webpack-validator');

const config = {
  entry: [
    'react-hot-loader/patch',
    './main',
  ],
  resolve: {
    extensions: ['', '.js', '.json', '.less', '.css'],
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel',
        exclude: /node_modules/,
      }, {
        test: /\.(less|css)$/,
        loaders: ['style', 'css', 'less'],
      }, {
        test: /\.(jpg|png|woff|ttf|eot|woff2|svg)$/,
        loader: 'url?limit=25000',
      },
    ],
  },
};

module.exports = validator(config);
