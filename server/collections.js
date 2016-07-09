/* eslint-disable import/no-unresolved */
import { Mongo } from 'meteor/mongo';
import _Loops from './loops';
import _Notifications from './notifications';
import _Organisations from './organisations';
import _Profiles from './profiles';
import _Programs from './programs';
import _Roles from './roles';

export const Loops = _Loops;
export const Messages = new Mongo.Collection('messages');
export const Notifications = _Notifications;
export const Organisations = _Organisations;
export const Profiles = _Profiles;
export const Programs = _Programs;
export const Roles = _Roles;
