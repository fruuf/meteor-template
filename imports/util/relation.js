/* eslint-disable react/no-multi-comp */
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import intersection from 'lodash/intersection';
import uniq from 'lodash/uniq';
import flatten from 'lodash/flatten';

export const find = (key, collection, query, options = {}) => (props) => {
  let queryObject = query;
  let optionsObject = options;
  if (key === 'userId' || key === 'user') throw new Error('\'user\' and \'userId\' are read-only');
  if (props[key] !== undefined) throw new Error(`'${key}' is already defined`);
  if (isFunction(query)) queryObject = query(props);
  if (isFunction(options)) optionsObject = options(props);
  if (isObject(queryObject) && isObject(optionsObject)) {
    // eslint-disable-next-line
    if (!props._cursors) props._cursors = {};
    // eslint-disable-next-line
    if (!props._cursors[collection._name]) props._cursors[collection._name] = [];
    const cursor = collection.find(queryObject, optionsObject);
    // eslint-disable-next-line
    props._cursors[collection._name].push(cursor);
    const documents = cursor.fetch();
    return Object.assign(props, { [key]: documents });
  }
  return Object.assign(props, { [key]: [] });
};

export const findOne = (key, collection, query, options = {}) => (props) => {
  let queryObject = query;
  let optionsObject = options;
  if (key === 'userId' || key === 'user') throw new Error('\'user\' and \'userId\' are read-only');
  if (props[key] !== undefined) throw new Error(`'${key}' is already defined`);
  if (isFunction(query)) queryObject = query(props);
  if (isFunction(options)) optionsObject = options(props);
  if (isObject(queryObject) && isObject(optionsObject)) {
    optionsObject.limit = 1;
    // eslint-disable-next-line
    if (!props._cursors) props._cursors = {};
    // eslint-disable-next-line
    if (!props._cursors[collection._name]) props._cursors[collection._name] = [];
    const cursor = collection.find(queryObject, optionsObject);
    // eslint-disable-next-line
    props._cursors[collection._name].push(cursor);
    const [doc] = cursor.fetch();
    return Object.assign(props, { [key]: doc || false });
  }
  return Object.assign(props, { [key]: false });
};

export const combine = (...relations) => (props) => {
  if (relations.length === 0) throw new Error('can\'t combine zero queries');
  if (relations.length === 1) return relations[0](props);
  return relations.reduce((query, relation) => {
    if (!query) return false;
    let queryObject = relation;
    if (isFunction(relation)) queryObject = relation(props);
    if (!isObject(queryObject)) return false;
    const conflicts = intersection(Object.keys(queryObject), Object.keys(query));
    if (conflicts.length) {
      const strConflicts = conflicts.map((conflict) => `'${conflict}'`).join(', ');
      throw new Error(`conflict in merging queries on ${strConflicts}`);
    } else {
      return Object.assign(query, queryObject);
    }
  }, {});
};

export const relation = (field, subject, identifier = false) => (props) => {
  // if we dont specify an identifier, take the value from the key in props directly, not from the document
  // for the examples, this would be (1)
  if (identifier === false) {
    const id = props[subject];
    // use the $in... syntax when its an array!
    if (id && isArray(id) && id.length) {
      return { [field]: { $in: id } };
    } else if (id && isString(id)) {
      return { [field]: id };
    }
    return false;
  }
  // this part has an identifier, so we expect props[subject] to be a previously resolved document
  if (props[subject] && isArray(props[subject])) {
    // if the previously resolved part is an array, we search for the relation in all of the documents (example 3)
    const ids = uniq(flatten(props[subject].map((document) => document[identifier] || [])));
    if (ids.length) {
      return { [field]: { $in: ids } };
    }
    return false;
  }
  if (props[subject] && props[subject][identifier]) {
    // this part would be (2) in the example, the subject (the thing that has the relation data)
    // is an object, so we're searchng for the value of identifier in that object
    const id = props[subject][identifier];
    // again we allow for arrays as well
    if (id && isArray(id) && id.length) {
      return { [field]: { $in: id } };
    } else if (id && isString(id)) {
      return { [field]: id };
    }
  }
  return false;
};

export const merge = (...relations) => (props) => {
  const $or = relations.map(mapRelation => {
    let queryObject = mapRelation;
    if (isFunction(queryObject)) queryObject = queryObject(props);
    if (!isObject(queryObject)) return false;
    return queryObject;
  });
  if ($or.some(part => !part)) return false;
  return { $or };
};

export const optionalRelation = (field, subject, identifier = false) => (props) =>
  relation(field, subject, identifier)(props) || {};
