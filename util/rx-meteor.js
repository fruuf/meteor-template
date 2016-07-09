/* eslint-disable react/no-multi-comp */
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
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
import zipObject from 'lodash/zipObject';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import pick from 'lodash/pick';


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

export const createAutorunStream = (getMeteorData, propsStream = Observable.of({}), propsList = false) => {
  const observable = pickStream(propsStream, propsList).switchMap(props => Observable.create((observer) => {
    const autorunHandler = Tracker.autorun(() => {
      observer.next(getMeteorData(props));
    });
    return () => {
      autorunHandler.stop();
    };
  }));
  return observable.cache(1);
};

export const createConnection = (name, paramsList, ...parts) => ({
  name,
  paramsList,
  reducer: compose(...parts, props => Object.keys(props).reduce((acc, cur) => (
    cur === '_cursors' && !Meteor.isServer
    ? acc
    : Object.assign(acc, { [cur]: props[cur] || undefined })
  ), {})),
});

const createSubscriptionStream = (name, paramsList, propsStream = Observable.of({})) => {
  const cleanPropsStream = pickStream(propsStream, paramsList);
  const autorun = props => {
    const params = paramsList.map(paramName => props[paramName]);
    const subscription = Meteor.subscribe(name, ...params);
    return { ready: subscription.ready() };
  };
  return createAutorunStream(autorun, cleanPropsStream);
};

export const createConnectionStream = (connection, propsStream = Observable.of({})) => Observable.combineLatest(
  createSubscriptionStream(connection.name, connection.paramsList, propsStream),
  createAutorunStream(
    props => connection.reducer(Object.assign({ user: Meteor.user(), userId: Meteor.userId() }, props)),
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
  // eslint-disable-next-line
  Meteor.publish(connection.name, function publicationCreator(...params) {
    const props = Object.assign(zipObject(connection.paramsList, params), {
      userId: this.userId,
      user: this.userId ? Meteor.users.findOne(this.userId) : false,
    });
    const connectedProps = connection.reducer(props);

    //eslint-disable-next-line
    const cursors = Object.keys(connectedProps._cursors || {}).map(collectionName => {
      //eslint-disable-next-line
      const collectionCursors = connectedProps._cursors[collectionName];
      return collectionCursors[collectionCursors.length - 1];
    });
    //eslint-disable-next-line
    console.log(`publish '${connection.name}' with ${cursors.length} cursors (${Object.keys(connectedProps._cursors || {})})`);
    return cursors;
  });
};

export const createMethod = (name, paramsList, ...parts) => {
  const reducer = compose(...parts);
  const method = (...params) => {
    const userId = Meteor.userId();
    const user = Meteor.user() || false;
    const props = Object.assign(zipObject(paramsList, params), { userId, user });
    return reducer(props);
  };
  Meteor.methods({ [name]: method });
  return (props) => Observable.create(observer => {
    const params = paramsList.map(paramName => props[paramName]);
    Meteor.call(name, ...params, (err, result) => {
      if (err) {
        observer.complete();
      } else {
        observer.next(result);
        observer.complete();
      }
    });
  });
};
