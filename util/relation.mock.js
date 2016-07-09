/* eslint-disable react/no-multi-comp */
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import intersection from 'lodash/intersection';
import uniq from 'lodash/uniq';
import flatten from 'lodash/flatten';

export const find = (key, collection, query, options = {}) => props => [];

export const findOne = (key, collection, query, options = {}) => props => undefined;

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
