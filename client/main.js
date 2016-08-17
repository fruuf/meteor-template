/* global document */
import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import App from './app';

render(<AppContainer><App /></AppContainer>, document.getElementById('render'));

if (module.hot) {
  module.hot.accept('./app', () => {
    // eslint-disable-next-line global-require
    const NewApp = require('./app').default;

    render(<AppContainer><NewApp /></AppContainer>, document.getElementById('render'));
  });
}
