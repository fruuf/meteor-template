/* eslint-disable react/no-multi-comp, import/no-extraneous-dependencies */
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
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import uniq from 'lodash/uniq';
import omit from 'lodash/omit';


const shallowEqual = (objA, objB) =>
  Object.keys(objA).length === Object.keys(objB).length
  && Object.keys(objA).every(key => objA[key] === objB[key])
;


const pickStream = (stream, propsList) => (
  isArray(propsList)
  ? stream.map(props => pick(props, propsList)).distinctUntilChanged(shallowEqual)
  : stream
);


export const mergeQueries = collectionMeta => {
  const queries = collectionMeta.map(meta => meta.query);
  const queryParts = queries.reduce((compactQueries, currentQuery) => {
    const currentKeys = Object.keys(currentQuery).sort();
    let queryMatched = false;
    const updatedCompactQueries = compactQueries.map(compactQuery => {
      const compactKeys = Object.keys(compactQuery);
      // dont merge if already merged
      if (queryMatched) return compactQuery;
      // dont merge if key length is different
      if (currentKeys.length !== compactKeys.length) return compactQuery;
      // dont merge if keys are not the same
      if (currentKeys.some(key => compactQuery[key] === undefined)) return compactQuery;
      // dont merge if more then one part is different
      if (currentKeys.reduce((count, key) => (count + (currentQuery[key] !== compactQuery[key] ? 1 : 0)), 0) > 1) {
        return compactQuery;
      }
      const mergeKey = currentKeys.find(key => currentQuery[key] !== compactQuery[key]);
      const mergedValues = [currentQuery[mergeKey], compactQuery[mergeKey]].reduce((values, currentValue) => {
        if (currentValue.$in && isArray(currentValue.$in)) return values.concat(currentValue.$in);
        return values.concat([currentValue]);
      }, []);
      const normalisedMergedValues = uniq(mergedValues.sort());
      queryMatched = true;
      return Object.assign({}, compactQuery, { [mergeKey]: { $in: normalisedMergedValues } });
    });
    // we've matched it, doesnt need to be added
    if (queryMatched) return updatedCompactQueries;
    // add it to the compactQueries
    return updatedCompactQueries.concat([currentQuery]);
  }, []);
  if (queryParts.length === 1) return queryParts[0];
  return queryParts.reduce((query, part) => {
    query.$or.push(part);
    return query;
  }, { $or: [] });
};


const mergeOptions = (collectionMeta) => collectionMeta.reduce((mergedOptions, meta, index) => {
  if (meta.options.limit && !meta.findOne) throw new Error('queries with limit can\'t be merged');
  const options = omit(meta.options, ['limit']);
  if (!index) return options;
  if (!isEqual(mergedOptions.sort, meta.options.sort)) throw new Error('cant merge sort');
  return mergedOptions;
}, {});


const getCollectionCursor = collectionMeta => {
  if (collectionMeta.length === 1) {
    return collectionMeta[0].cursor;
  }
  const { collection } = collectionMeta[0];
  const query = mergeQueries(collectionMeta);
  const options = mergeOptions(collectionMeta);
  return collection.find(query, options);
};


export const compose = (...parts) => (props) => {
  // zero parts provided, just return the current props and dont do anything
  if (parts.length === 0) return props;
  // otherwise call them in order with the current props or merge into the current props
  // if a part is an object
  return parts.reduce((_props, part) => {
    if (isFunction(part)) return part(_props);
    if (isObject(part)) return Object.assign({}, _props, part);
    throw new Error('part must be function or object');
  }, props);
};

export const createAutorunStream = (getMeteorData, propsStream = Observable.of({}), propsList = false) => {
  const observable = pickStream(propsStream, propsList).switchMap(props => Observable.create((observer) => {
    let autorunHandler;
    Tracker.nonreactive(() => {
      autorunHandler = Tracker.autorun(() => {
        observer.next(getMeteorData(props));
      });
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
  reducer: compose(
    ...parts,
    props => Object.keys(props).reduce((acc, cur) => (
      cur === '_meta' && !Meteor.isServer
      ? acc
      : Object.assign(acc, { [cur]: props[cur] || undefined })
    ), {})
  ),
});

export const createConnectionStream = (connection, propsStream = Observable.of({})) => createAutorunStream(
  compose(
    props => {
      const params = connection.paramsList.map(paramName => props[paramName]);
      const subscription = Meteor.subscribe(connection.name, ...params);
      return Object.assign({
        user: Meteor.user(),
        userId: Meteor.userId(),
        ready: subscription.ready(),
      }, props);
    },
    connection.reducer
  ),
  propsStream,
  connection.paramsList
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
    const cursors = Object.keys(connectedProps._meta || {}).map(collectionName => {
      //eslint-disable-next-line
      const collectionMeta = connectedProps._meta[collectionName];
      return getCollectionCursor(collectionMeta);
    });
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

export const createInlineMethod = (paramsList = [], ...parts) => {
  const reducer = compose(...parts);
  return (...params) => {
    const userId = Meteor.userId();
    const user = Meteor.user() || false;
    const props = Object.assign(zipObject(paramsList, params), { userId, user });
    return reducer(props);
  };
};
