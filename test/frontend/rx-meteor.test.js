import sinon from 'sinon';
import { findOne } from '~/util/relation';
// tracker mock
const stop = sinon.stub();
const autorun = sinon.spy(autorunCallback => {
  autorunCallback();
  return { stop };
});
const Tracker = { autorun };

const isServer = false;
const isClient = true;
const userId = sinon.stub().returns('user:1');
const user = sinon.stub().returns({ _id: 'user:1' });
const call = sinon.spy((method, ...args) => { const callback = args.pop(); callback(undefined, [...args]); });
const methods = sinon.stub();
const publish = sinon.stub();
const ready = sinon.stub().returns(true);
const subscribe = sinon.stub().returns({ ready });
const users = { findOne: sinon.stub().returns({ _id: 'user:1' }) };
const Meteor = { isServer, isClient, userId, user, call, methods, publish, subscribe, users };

const createFakeCollection = name => ({
  _name: name,
  find: sinon.stub().returns({ cursor: true, fetch: () => ([{ _id: `${name}:1` }]) }),
});

const {
  compose, createAutorunStream, createConnection, createConnectionStream, publishConnection, createMethod,
} = mockImport('~/util/rx-meteor', {
  'meteor/tracker': { Tracker },
  'meteor/meteor': { Meteor },
});

describe('util/rx-meteor', () => {
  describe('compose', () => {
    it('is a function', () => {
      expect(compose).to.be.a('function');
    });

    it('composes two functions props => newProps', () => {
      const initialProps = {};
      const foo = props => Object.assign({}, props, { foo: true });
      const bar = props => Object.assign({}, props, { bar: true });
      const expectedProps = { foo: true, bar: true };
      const composed = compose(foo, bar);
      expect(composed(initialProps)).to.deep.equal(expectedProps);
    });

    it('executes functions in order', () => {
      const initialProps = {};
      const foo = props => Object.assign({}, props, { foo: 1 });
      const bar = props => Object.assign({}, props, { bar: props.foo + 1 });
      const foobar = props => Object.assign({}, props, { foobar: props.bar + 1 });
      const expectedProps = { foo: 1, bar: 2, foobar: 3 };
      const composed = compose(foo, bar, foobar);
      expect(composed(initialProps)).to.deep.equal(expectedProps);
    });

    it('accepts objects', () => {
      const initialProps = {};
      const foo = props => Object.assign({}, props, { foo: true });
      const bar = { bar: true };
      const expectedProps = { foo: true, bar: true };
      const composed = compose(foo, bar);
      expect(composed(initialProps)).to.deep.equal(expectedProps);
    });

    it('accepts one part', () => {
      const initialProps = {};
      const foo = props => Object.assign({}, props, { foo: true });
      const expectedProps = { foo: true };
      const composed = compose(foo);
      expect(composed(initialProps)).to.deep.equal(expectedProps);
    });

    it('function parts dont get merged', () => {
      const initialProps = {};
      const foo = { foo: true };
      const bar = () => ({ bar: true });
      const expectedProps = { bar: true };
      const composed = compose(foo, bar);
      expect(composed(initialProps)).to.deep.equal(expectedProps);
    });

    it('merges in objects objects', () => {
      const initialProps = {};
      const foo = props => Object.assign({}, props, { foo: 1, bar: 1 });
      const bar = { bar: 2 };
      const expectedProps = { foo: 1, bar: 2 };
      const composed = compose(foo, bar);
      expect(composed(initialProps)).to.deep.equal(expectedProps);
    });

    it('returns props on zero parts', () => {
      const initialProps = { foo: 1 };
      const expectedProps = { foo: 1 };
      const composed = compose();
      expect(composed(initialProps)).to.deep.equal(expectedProps);
    });
  });

  describe('createAutorunStream', () => {
    it('is a function', () => {
      expect(createAutorunStream).to.be.a('function');
    });

    it('registers a Tracker.autorun handle', () => {
      Tracker.autorun.reset();
      const autorunStream = createAutorunStream(() => 'a');
      expectObservable(autorunStream).toBe('a--');
      flush();
      expect(Tracker.autorun.callCount).to.equal(1);
    });

    it('stops the handle on unsubscribe', () => {
      Tracker.autorun.reset();
      stop.reset();
      const autorunStream = createAutorunStream(() => 'a');
      expectObservable(autorunStream, '^-!').toBe('a--');
      flush();
      expect(Tracker.autorun.callCount).to.equal(1);
      expect(stop.callCount).to.equal(1);
    });

    it('stops old handle on new props', () => {
      Tracker.autorun.reset();
      stop.reset();
      const propsStream = cold('a-b--');
      const autorunStream = createAutorunStream(() => 'c', propsStream);
      expectObservable(autorunStream).toBe('c-c--');
      flush();
      expect(Tracker.autorun.callCount).to.equal(2);
      expect(stop.callCount).to.equal(1);
    });

    it('runs on props.next', () => {
      const propsStream = cold('a-b-c-');
      const autorunStream = createAutorunStream(props => props, propsStream);
      expectObservable(autorunStream).toBe('a-b-c-');
    });

    it('accepts a propsList', () => {
      const propsStream = cold('a-', {
        a: { foo: 1, bar: 1 },
      });
      const autorunStream = createAutorunStream(props => props, propsStream, ['foo']);
      expectObservable(autorunStream).toBe('a-', {
        a: { foo: 1 },
      });
    });

    it('dirty-checks the propsList', () => {
      const propsStream = cold('a-b-c-', {
        a: { foo: 1, bar: 1 },
        b: { foo: 1, bar: 2 },
        c: { foo: 2, bar: 2 },
      });
      const autorunStream = createAutorunStream(props => props, propsStream, ['foo']);
      expectObservable(autorunStream).toBe('a---b-', {
        a: { foo: 1 },
        b: { foo: 2 },
      });
    });

    it('shares one handle between instances', () => {
      Tracker.autorun.reset();
      const propsStream = cold('a----');
      const autorunStream = createAutorunStream(props => props, propsStream);
      expectObservable(autorunStream).toBe('a');
      expectObservable(autorunStream).toBe('a');
      flush();
      expect(Tracker.autorun.callCount).to.equal(1);
    });
  });

  describe('createConnection', () => {
    it('is a function', () => {
      expect(createConnection).to.be.a('function');
    });

    it('takes a name, a paramsList and parts', () => {
      const name = 'test-connection';
      const paramsList = [];
      const part1 = () => {};
      const connection = createConnection(name, paramsList, part1);
      expect(connection.name).to.equal(name);
      expect(connection.paramsList).to.deep.equal(paramsList);
    });

    it('composes its parts', () => {
      const name = 'test-connection';
      const paramsList = [];
      const part1 = () => ({ foo: true });
      const part2 = { bar: true };
      const initialProps = {};
      const expectedReducerProps = { foo: true, bar: true };
      const connection = createConnection(name, paramsList, part1, part2);
      expect(connection.reducer(initialProps)).to.deep.equal(expectedReducerProps);
    });
  });

  const FooCollection = createFakeCollection('foo');
  const BarCollection = createFakeCollection('bar');

  const fooConnection = createConnection(
    'foo-connection',
    [],
    findOne('foo', FooCollection, {})
  );

  const barConnection = createConnection(
    'bar-connection',
    ['barId'],
    findOne('bar', BarCollection, {})
  );

  const fooBarConnection = createConnection(
    'foo-bar-connection',
    ['fooId', 'barId'],
    findOne('foo', FooCollection, {}),
    findOne('bar', BarCollection, {})
  );

  describe('createConnectionStream', () => {
    it('has user and userId as props', () => {
      const userConnection = createConnection('user-connection', []);
      const connectionStream = createConnectionStream(userConnection);
      expectObservable(connectionStream).toBe('a---', {
        a: {
          ready: true,
          userId: 'user:1',
          user: { _id: 'user:1' },
        },
      });
    });

    it('returns props of a connection', () => {
      const connectionStream = createConnectionStream(fooConnection);
      expectObservable(connectionStream).toBe('a---', {
        a: {
          foo: {
            _id: 'foo:1',
          },
          ready: true,
          userId: 'user:1',
          user: { _id: 'user:1' },
        },
      });
    });

    it('subscribes to publication', () => {
      Meteor.subscribe.reset();
      const connectionStream = createConnectionStream(fooConnection);
      connectionStream.subscribe();
      flush();
      expect(Meteor.subscribe.calledWith('foo-connection')).to.equal(true);
      expect(Meteor.subscribe.callCount).to.equal(1);
    });

    it('subscribes to publication with params', () => {
      Meteor.subscribe.reset();
      const propsStream = cold('a---', { a: { barId: 'bar:1' } });
      const connectionStream = createConnectionStream(barConnection, propsStream);
      connectionStream.subscribe();
      flush();
      expect(Meteor.subscribe.calledWith('bar-connection', 'bar:1')).to.equal(true);
      expect(Meteor.subscribe.callCount).to.equal(1);
    });

    it('subscribes to publication with multiple params', () => {
      Meteor.subscribe.reset();
      const propsStream = cold('a---', { a: { fooId: 'foo:1', barId: 'bar:1' } });
      const connectionStream = createConnectionStream(fooBarConnection, propsStream);
      connectionStream.subscribe();
      flush();
      expect(Meteor.subscribe.calledWith('foo-bar-connection', 'foo:1', 'bar:1')).to.equal(true);
      expect(Meteor.subscribe.callCount).to.equal(1);
    });

    it('updates subscription params', () => {
      Meteor.subscribe.reset();
      const propsStream = cold('a-b-', { a: { barId: 'bar:1' }, b: { barId: 'bar:2' } });
      const connectionStream = createConnectionStream(barConnection, propsStream);
      connectionStream.subscribe();
      flush();
      expect(Meteor.subscribe.calledWith('bar-connection', 'bar:1')).to.equal(true);
      expect(Meteor.subscribe.calledWith('bar-connection', 'bar:2')).to.equal(true);
      expect(Meteor.subscribe.callCount).to.equal(2);
    });

    it('returns all props of a composed connection', () => {
      const propsStream = cold('a---', { a: { fooId: 'foo:1', barId: 'bar:1' } });
      const connectionStream = createConnectionStream(fooBarConnection, propsStream);
      expectObservable(connectionStream).toBe('a---', {
        a: {
          fooId: 'foo:1',
          foo: {
            _id: 'foo:1',
          },
          barId: 'bar:1',
          bar: {
            _id: 'bar:1',
          },
          ready: true,
          userId: 'user:1',
          user: { _id: 'user:1' },
        },
      });
    });

    it('updates props reactive', () => {
      const propsStream = cold('a-b-', { a: { barId: 'bar:1' }, b: { barId: 'bar:2' } });
      const connectionStream = createConnectionStream(barConnection, propsStream);
      const subscription = sinon.stub();
      const handle = connectionStream.subscribe(subscription);
      flush();
      expect(subscription.calledWith({
        barId: 'bar:1',
        bar: {
          _id: 'bar:1',
        },
        ready: true,
        userId: 'user:1',
        user: { _id: 'user:1' },
      })).to.equal(true);

      expect(subscription.calledWith({
        barId: 'bar:2',
        bar: {
          _id: 'bar:1',
        },
        ready: true,
        userId: 'user:1',
        user: { _id: 'user:1' },
      })).to.equal(true);
      handle.unsubscribe();
    });
  });

  describe('publishConnection', () => {
    it('is a function', () => {
      expect(publishConnection).to.be.a('function');
    });

    it('publishes a connection', () => {
      Meteor.publish.reset();
      publishConnection(fooConnection);
      expect(Meteor.publish.calledWith('foo-connection')).to.equal(true);
      expect(Meteor.publish.callCount).to.equal(1);
    });

    it('publish function returns all cursors', () => {
      Meteor.publish.reset();
      Meteor.isClient = false;
      Meteor.isServer = true;
      publishConnection(fooBarConnection);
      expect(Meteor.publish.calledWith('foo-bar-connection')).to.equal(true);
      expect(Meteor.publish.callCount).to.equal(1);
      const publishFunction = Meteor.publish.getCall(0).args[1];
      expect(publishFunction).to.be.a('function');
      expect(publishFunction('foo:1', 'bar:1')).to.have.length(2);
    });

    it('publish function has user and userId', () => {
      Meteor.publish.reset();
      Meteor.users.findOne.reset();
      const part = sinon.stub().returns({});
      const testConnection = createConnection('test-connection', [], part);
      publishConnection(testConnection);
      expect(Meteor.publish.calledWith('test-connection')).to.equal(true);
      expect(Meteor.publish.callCount).to.equal(1);
      const publishFunction = Meteor.publish.getCall(0).args[1];
      expect(publishFunction).to.be.a('function');
      publishFunction.call({ userId: 'user:1' });
      expect(Meteor.users.findOne.callCount).to.equal(1);
      expect(part.callCount).to.equal(1);
      expect(part.calledWith({ userId: 'user:1', user: { _id: 'user:1' } })).to.equal(true);
    });

    it('publish function has params as props', () => {
      Meteor.publish.reset();
      const part = sinon.stub().returns({});
      const testConnection = createConnection('test-connection', ['fooId'], part);
      publishConnection(testConnection);
      expect(Meteor.publish.calledWith('test-connection')).to.equal(true);
      expect(Meteor.publish.callCount).to.equal(1);
      const publishFunction = Meteor.publish.getCall(0).args[1];
      expect(publishFunction).to.be.a('function');
      publishFunction.call({ userId: 'user:1' }, 'foo:1');
      expect(part.callCount).to.equal(1);
      expect(part.calledWith({ userId: 'user:1', user: { _id: 'user:1' }, fooId: 'foo:1' })).to.equal(true);
    });
  });

  describe('createMethod', () => {
    it('is a function', () => {
      expect(createMethod).to.be.a('function');
    });

    it('registers a method with meteor', () => {
      Meteor.methods.reset();
      createMethod(
        'test-method',
        [],
        () => {}
      );
      expect(Meteor.methods.calledOnce).to.equal(true);
      const methodsList = Object.keys(Meteor.methods.getCall(0).args[0]);
      expect(methodsList).to.deep.equal(['test-method']);
    });

    it('stream has meteor.call return value', () => {
      Meteor.call.reset();
      const method = createMethod(
        'test-method',
        ['fooId'],
        () => {} // ignored by meteor.call
      );
      const actionStream = cold('--a--', { a: { fooId: 'foo:1' } });
      const resultStream = actionStream.switchMap(method);
      expectObservable(resultStream).toBe('--r--', { r: ['foo:1'] });
      flush();
      expect(Meteor.call.callCount).to.equal(1);
    });

    it('calls the parts with user and userId', () => {
      Meteor.methods.reset();
      createMethod(
        'test-method',
        [],
        props => props
      );
      expect(Meteor.methods.calledOnce).to.equal(true);
      const method = Meteor.methods.getCall(0).args[0]['test-method'];
      expect(method()).to.deep.equal({ userId: 'user:1', user: { _id: 'user:1' } });
    });

    it('takes arguments', () => {
      Meteor.methods.reset();
      createMethod(
        'test-method',
        ['fooId'],
        props => props
      );
      expect(Meteor.methods.calledOnce).to.equal(true);
      const method = Meteor.methods.getCall(0).args[0]['test-method'];
      expect(method('foo:1')).to.deep.equal({ userId: 'user:1', user: { _id: 'user:1' }, fooId: 'foo:1' });
    });

    it('calls parts in order', () => {
      Meteor.methods.reset();
      createMethod(
        'test-method',
        ['text'],
        props => Object.assign({}, props, { text: `${props.text}b` }),
        props => Object.assign({}, props, { text: `${props.text}c` })
      );
      expect(Meteor.methods.calledOnce).to.equal(true);
      const method = Meteor.methods.getCall(0).args[0]['test-method'];
      expect(method('a')).to.deep.equal({ userId: 'user:1', user: { _id: 'user:1' }, text: 'abc' });
    });

    it('return value doesnt have to be an object', () => {
      Meteor.methods.reset();
      createMethod(
        'test-method',
        ['text'],
        props => Object.assign({}, props, { text: `${props.text}b` }),
        props => `${props.text}c`
      );
      expect(Meteor.methods.calledOnce).to.equal(true);
      const method = Meteor.methods.getCall(0).args[0]['test-method'];
      expect(method('a')).to.equal('abc');
    });
  });
});
