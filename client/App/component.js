import React, { PropTypes } from 'react';
import './style';

const AppComponent = props => (
  <div className="todos">
    <h1>Todos</h1>
    <ul className="list">
      {props.todos.map(todo => (
        <li className="item" key={todo._id} id={todo._id}>
          <span className="text">{todo.text}</span>
          &nbsp;
          <span
            className="delete"
            onClick={() => props.dispatch('deleteTodo', todo._id)}
          >[rm]</span>
        </li>
      ))}
    </ul>
    <form>
      <div className="group">
        <input
          name="text"
          onChange={e => props.dispatch('changePost', e)}
          value={props.post.text || ''}
          placeholder="text"
        />
        <button
          className="add"
          onClick={e => { e.preventDefault(); props.dispatch('addTodo'); }}
          type="submit"
        >
          add
        </button>
      </div>
    </form>
  </div>
);

AppComponent.propTypes = {
  todos: PropTypes.array,
  user: PropTypes.object,
  dispatch: PropTypes.func,
};

export default AppComponent;
