/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/cache';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/retry';
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

export const connectComponent = (component, stateCreator, propsList = false) => {
  class ObservableContainer extends Component {
    constructor() {
      super();
      this.state = null;
    }

    componentDidMount() {
      this.actionStream = new Subject();
      this.propsStream = new Subject();
      this.dispatch = (type, data) => {
        this.actionStream.next({ type, data });
      };
      const cleanPropsStream = pickStream(this.propsStream.startWith(this.props || {}), propsList).cache(1);
      const listenStream = new Subject();
      const setStateStream = listenStream
        .mergeMap(stream => stream.retry(10));
      this.subscription = setStateStream.startWith({}).subscribe(this.setState.bind(this));
      const listen = listenStream.next.bind(listenStream);
      this.cleanup = stateCreator(cleanPropsStream, this.actionStream, listen, this.dispatch);
    }

    componentWillReceiveProps(nextProps) {
      this.propsStream.next(nextProps);
    }

    componentWillUnmount() {
      this.propsStream.complete();
      this.actionStream.complete();
      this.subscription.unsubscribe();
      if (isFunction(this.cleanup)) this.cleanup();
    }

    render() {
      if (!this.state) return null;
      const { dispatch } = this;
      const props = Object.assign({}, this.props, this.state, { dispatch });
      return React.createElement(component, props);
    }
  }
  return ObservableContainer;
};

export const createPureRenderContainer = component => {
  class PureRenderContainer extends Component {
    shouldComponentUpdate(nextProps) {
      return !shallowEqual(nextProps, this.props);
    }
    render() {
      return React.createElement(component, this.props);
    }
  }
  return PureRenderContainer;
};

export const defineEvent = (actionStream, eventName) => actionStream
  .filter(action => action.type === eventName)
  .map(action => action.data)
;
