/* global document */
import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import App from './App';

render(<AppContainer><App /></AppContainer>, document.getElementById('render'));

if (module.hot) {
  module.hot.accept('./App', () => {
    // eslint-disable-next-line global-require
    const NewApp = require('./App').default;

    render(<AppContainer><NewApp /></AppContainer>, document.getElementById('render'));
  });
}
