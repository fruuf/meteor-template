import React from 'react';

const todosConnection = createConnection(() => (
  { todos: [
    { _id: 'todo:1', name: 'foo' },
    { _id: 'todo:2', name: 'bar' },
  ],
  }
));

const addTodo = createMethod(() => {});
const deleteTodo = createMethod(() => {});

const App = mockImportDefault('~/client/App', {
  './meteor': { todosConnection, addTodo, deleteTodo },
});

describe('<App />', () => {
  const wrapper = mount(<App />);

  it('is present', () => {
    expect(wrapper).to.be.present();
  });

  it('renders items', () => {
    expect(wrapper.find('.list .item')).to.have.length(2);
  });

  it('updates reactive', () => {
    todosConnection.update(() => ({
      todos: [
        { _id: 'todo:1', name: 'foo' },
      ],
    }));
    expect(wrapper.find('.list .item')).to.have.length(1);
  });

  it('has an input field', () => {
    expect(wrapper.find('form input')).to.be.present();
  });

  it('updates post data', () => {
    const textInput = wrapper.find('form input');
    textInput.get(0).value = 'foo';
    textInput.simulate('change');
    expect(wrapper.find('form input').get(0).value).to.equal('foo');
  });

  it('has add todo button', () => {
    expect(wrapper.find('.add')).to.be.present();
  });

  it('adds a todo', () => {
    wrapper.find('.add').simulate('click');
    expect(addTodo.calledWith({ data: { text: 'foo' } })).to.equal(true);
  });

  it('resets post after add', () => {
    expect(wrapper.find('form input').get(0).value).to.equal('');
  });

  it('doesnt post when there is no message', () => {
    addTodo.reset();
    wrapper.find('.add').simulate('click');
    expect(addTodo.callCount).to.equal(0);
  });

  it('has a delete button', () => {
    expect(wrapper.find('#todo:1 .delete')).to.be.present();
  });

  it('deletes a todo', () => {
    const deleteButton = wrapper.find('#todo:1 .delete');
    deleteButton.simulate('click');
    expect(deleteTodo.calledWith({ todoId: 'todo:1' })).to.equal(true);
  });
});
