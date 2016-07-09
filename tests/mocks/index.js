/* eslint-disable global-require */
import path from 'path';

const absRequire = modulePath => require(path.join(__dirname, '../..', modulePath));

const mocks = {
  '/imports/api/util-relation': absRequire('/imports/api/util-relation.mock'),
  '/imports/api/util-rx-meteor': absRequire('/imports/api/util-rx-meteor.mock'),
  '/imports/api/collections': absRequire('/imports/api/collections.mock'),
  'meteor/session': require('./session'),
  'meteor/juliancwirko:s-alert': require('./s-alert'),
  'meteor/iron:router': require('./router'),
  'meteor/meteor': require('./meteor'),
};


export default mocks;
