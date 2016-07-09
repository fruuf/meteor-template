import React, { PropTypes } from 'react';
import { connectComponent } from '~/util/rx-react';
import { createState } from './state';
import './app-style';

const TodosComponent = props => (
  <div className="container">
    <h1>Todos</h1>
    {props.user && <p className="welcome-back">Welcome back</p>}
    <ul className="todos">
      {props.todos.map(todo => (
        <li className="todo" key={todo._id}>{todo.text}</li>
      ))}
    </ul>
    <form className="post">
      <input
        className="text"
        name="text"
        onChange={e => props.dispatch('changePost', e)}
        value={props.post.text || ''}
      />
      <button
        className="add-todo"
        onClick={e => { e.preventDefault(); props.dispatch('addTodo'); }}
        type="submit"
      >Add Todo</button>
    </form>
  </div>
);

TodosComponent.propTypes = {
  todos: PropTypes.array,
  user: PropTypes.object,
  dispatch: PropTypes.func,
};

export default connectComponent(TodosComponent, createState);
