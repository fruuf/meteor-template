import React, { PropTypes } from 'react';
import { connectComponent, defineEvent } from '~/util/rx-react';
import { Observable } from 'rxjs';
import sinon from 'sinon';

const Component = props => (
  <div>
    <button onClick={() => props.dispatch('action', { foo: 'bar' })}>dispatch</button>
  </div>
);

Component.propTypes = {
  dispatch: PropTypes.func,
};

describe('util/rx-react', () => {
  it('sets state while listening to a stream', () => {
    const createState = (propsStream, actionStream, listen) => {
      const fooStream = Observable.of('foo');
      listen(fooStream.map(foo => ({ foo })));
    };
    const Container = connectComponent(Component, createState);
    const wrapper = mount(<Container />);
    expect(wrapper.state().foo).to.equal('foo');
  });

  it('dispatches an action', () => {
    const actionStub = sinon.stub().returns(Observable.empty());
    const createState = (propsStream, actionStream, listen) => {
      const onAction = defineEvent(actionStream, 'action');
      const actionResultStream = onAction.switchMap(actionStub);
      listen(actionResultStream.ignoreElements());
    };
    const Container = connectComponent(Component, createState);
    const wrapper = mount(<Container />);
    wrapper.find('button').simulate('click');
    expect(actionStub.calledOnce).to.equal(true);
    expect(actionStub.calledWith({ foo: 'bar' })).to.equal(true);
  });

  it('passes through original props', () => {
    const createState = () => {};
    const Container = connectComponent(Component, createState);
    const wrapper = mount(<Container foo="bar" />);
    expect(wrapper.find(Component).props().foo).to.equal('bar');
    expect(wrapper.state().foo).to.equal(undefined);
  });

  it('has a propsStream', () => {
    const createState = (propsStream, actionStream, listen) => {
      const doubleCounterStream = propsStream
        .map(props => props.counter * 2);
      listen(doubleCounterStream.map(doubleCounter => ({ doubleCounter })));
    };
    const Container = connectComponent(Component, createState);
    const wrapper = mount(<Container counter={1} />);
    expect(wrapper.find(Component).props().doubleCounter).to.equal(2);
    wrapper.setProps({ counter: 2 });
    expect(wrapper.find(Component).props().doubleCounter).to.equal(4);
  });

  it('unsubscribes on unmount', () => {
    const finallyHandler = sinon.stub();
    const cleanupHandler = sinon.stub();
    const createState = (propsStream, actionStream, listen) => {
      listen(propsStream.finally(finallyHandler));
      return cleanupHandler;
    };
    const Container = connectComponent(Component, createState);
    const wrapper = mount(<Container />);
    expect(wrapper).to.be.present();
    wrapper.unmount();
    expect(finallyHandler.calledOnce).to.equal(true);
    expect(cleanupHandler.calledOnce).to.equal(true);
  });
});
