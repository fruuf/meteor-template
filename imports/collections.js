// eslint-disable-next-line import/no-extraneous-dependencies
import { Mongo } from 'meteor/mongo';

// eslint-disable-next-line import/prefer-default-export
export const Todos = new Mongo.Collection('todos');
