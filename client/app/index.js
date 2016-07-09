import React, { PropTypes } from 'react';
import { connectComponent } from '~/util/rx-react';
import { createState } from './state';
import './style';

const TodosComponent = props => (
  <div className="container">
    <div className="row">
      <div className="col-md-6 col-md-offset-3">
        {!props.user && <h1>Todos</h1>}
        {props.user && <h1 className="welcome-back">Welcome back, {props.user.name}</h1>}
        <div className="list-group">
          {props.todos.map(todo => (
            <div className="list-group-item todo" key={todo._id} id={todo._id}>
              <div
                className="btn btn-danger btn-xs pull-right delete"
                onClick={() => props.dispatch('deleteTodo', todo._id)}
              >remove</div>
              <p className="list-group-item-text">{todo.text}</p>
            </div>
          ))}
        </div>
        <form className="form-horizontal">
          <div className="input-group">
            <input
              className="form-control text"
              name="text"
              onChange={e => props.dispatch('changePost', e)}
              value={props.post.text || ''}
              placeholder="text"
            />
            <div className="input-group-btn">
              <button
                className="btn btn-primary add"
                onClick={e => { e.preventDefault(); props.dispatch('addTodo'); }}
                type="submit"
              >add</button>
            </div>
          </div>
        </form>
      </div>
    </div>

  </div>
);

TodosComponent.propTypes = {
  todos: PropTypes.array,
  user: PropTypes.object,
  dispatch: PropTypes.func,
};

export default connectComponent(TodosComponent, createState);
