/* eslint-disable global-require */
import * as rxMeteorMock from './rx-meteor';
import * as meteorMock from './meteor';
import * as mongoMock from './mongo';

const mocks = {
  '~/util/rx-meteor': rxMeteorMock,
  'meteor/meteor': meteorMock,
  'meteor/mongo': mongoMock,
};


export default mocks;
