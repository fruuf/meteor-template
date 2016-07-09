/* eslint-disable react/no-multi-comp, no-unused-vars */
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/cache';
import 'rxjs/add/observable/empty';
import zipObject from 'lodash/zipObject';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';

const mockDataGenerators = {};

const shallowEqual = (objA, objB) =>
  Object.keys(objA).length === Object.keys(objB).length
  && Object.keys(objA).every(key => objA[key] === objB[key])
;


const pickStream = (stream, propsList) => (
  isArray(propsList)
  ? stream.map(props => pick(props, propsList)).distinctUntilChanged(shallowEqual)
  : stream
);


export const compose = (...parts) => (props) => {
  // zero parts provided, just return the current props and dont do anything
  if (parts.length === 0) return props;
  // otherwise call them in order with the current props or merge into the current props
  // if a part is an object
  return parts.reduce((_props, part) => {
    if (isFunction(part)) return part(_props);
    if (isObject(part)) return Object.assign({}, part, _props);
    throw new Error('part must be function or object');
  }, props);
};

export const createAutorunStream = (getMeteorData, propsStream = Observable.of({}), propsList = false) =>
  pickStream(propsStream, propsList)
  .switchMap(props => Observable.create((observer) => observer.next(getMeteorData(props))))
  .cache(1);

export const createConnection = (name, paramsList, ...parts) => ({
  name,
  paramsList,
  reducer: compose(...parts, props => Object.keys(props).reduce((acc, cur) => (
    Object.assign(acc, { [cur]: props[cur] || undefined })
  ), {})),
});

const createSubscriptionStream = (name, paramsList, propsStream = Observable.of({})) => Observable.of({ ready: true });

export const createConnectionStream = (connection, propsStream = Observable.of({})) => Observable.combineLatest(
  createSubscriptionStream(connection.name, connection.paramsList, propsStream),
  createAutorunStream(
    props => mockDataGenerators[connection.name](
      Object.assign({ user: Meteor.user(), userId: Meteor.userId() }, props)
    ),
    propsStream,
    connection.paramsList
  ),
  (subscriptionProps, connectionProps) => Object.assign(
    {},
    connectionProps,
    subscriptionProps
  )
);

export const publishConnection = (connection) => {

};

export const createMethod = (name, paramsList, ...parts) => {
  const reducer = compose(...parts);
  const method = (...params) => {
    const userId = undefined;
    const user = false;
    const props = Object.assign(zipObject(paramsList, params), { userId, user });
    return reducer(props);
  };

  return (props) => Observable.create(observer => {
    const params = paramsList.map(paramName => props[paramName]);
    try {
      const result = method(...params);
      observer.next(result);
      observer.complete();
    } catch (e) {
      observer.complete();
    }
  });
};

export const fakeConnection = (name, createMockData) => {
  mockDataGenerators[name] = createMockData;
};
