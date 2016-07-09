/* eslint-disable const/no-unresolved */
import sinon from 'sinon';

const mockCollection = name => ({
  name,
  find: sinon.stub(),
  findOne: sinon.stub(),
  insert: sinon.stub(),
  update: sinon.stub(),
});

export const Loops = mockCollection('loops');
export const Messages = mockCollection('messages');
export const Notifications = mockCollection('notifications');
export const Organisations = mockCollection('organisations');
export const Profiles = mockCollection('profiles');
export const Programs = mockCollection('programs');
export const Roles = mockCollection('roles');
