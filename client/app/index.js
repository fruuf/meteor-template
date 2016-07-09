import React, { PropTypes } from 'react';
import { connectComponent } from '~/util/rx-react';
import { createState } from './state';
import './app-style';

const TodosComponent = props => (
  <div className="container">
    <h1>Todos</h1>
    {props.user && <p className="welcome-back">Welcome back</p>}
    <div className="todos">
      {props.todos.map(todo => (
        <div className="todo" key={todo._id} id={todo._id}>
          <div className="text">{todo.text}</div>
          <div
            className="delete"
            onClick={() => props.dispatch('deleteTodo', todo._id)}
          >delete</div>
        </div>
      ))}
    </div>
    <form className={`post ${props.todos.length % 2 ? 'even' : 'odd'}`}>
      <input
        className="text"
        name="text"
        onChange={e => props.dispatch('changePost', e)}
        value={props.post.text || ''}
        placeholder="text"
      />
      <button
        className="add-todo"
        onClick={e => { e.preventDefault(); props.dispatch('addTodo'); }}
        type="submit"
      >add</button>
    </form>
  </div>
);

TodosComponent.propTypes = {
  todos: PropTypes.array,
  user: PropTypes.object,
  dispatch: PropTypes.func,
};

export default connectComponent(TodosComponent, createState);
