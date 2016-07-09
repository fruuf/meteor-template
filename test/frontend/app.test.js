import React from 'react';

const todosConnection = createConnection([], () => (
  { todos: [
    { _id: 'todo:1', name: 'foo' },
    { _id: 'todo:2', name: 'bar' },
  ],
  }
));

const addTodo = createMethod(() => {});

const App = mockImportDefault('~/client/app', {
  '~/meteor/todos': { todosConnection, addTodo },
});

describe('<App />', () => {
  const wrapper = mount(<App />);

  it('is present', () => {
    expect(wrapper).to.be.present();
  });

  it('has two items', () => {
    expect(wrapper.find('.todo')).to.have.length(2);
  });

  it('is not logged in', () => {
    expect(wrapper.find('.welcome-back')).to.have.length(0);
  });

  it('updates reactive', () => {
    todosConnection.update(() => ({
      todos: [
        { _id: 'todo:1', name: 'foo' },
      ],
    }));
    expect(wrapper.find('.todo')).to.have.length(1);
  });

  it('displays welcome message', () => {
    todosConnection.update(() => ({
      todos: [],
      user: { name: 'test' },
    }));
    expect(wrapper.find('.welcome-back')).to.have.length(1);
  });

  it('updates post data', () => {
    const textInput = wrapper.find('form .text');
    textInput.get(0).value = 'foo';
    textInput.simulate('change');
    expect(wrapper.find('form .text').get(0).value).to.equal('foo');
  });

  it('adds a todo', () => {
    wrapper.find('.add-todo').simulate('click');
    expect(addTodo.calledWith({ data: { text: 'foo' } })).to.equal(true);
  });

  it('resets post after add', () => {
    expect(wrapper.find('form .text').get(0).value).to.equal('');
  });
});
