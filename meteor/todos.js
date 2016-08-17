import { createConnection, createMethod } from '~/util/rx-meteor';
import { find } from '~/util/relation';
import { Todos } from './collections';

export const todosConnection = createConnection(
  'todos-connection',
  [],
  find('todos', Todos, {})
);

export const addTodo = createMethod(
  'addTodo',
  ['data'],
  ({ data }) => {
    Todos.insert(data);
  }
);

export const deleteTodo = createMethod(
  'deleteTodo',
  ['todoId'],
  ({ todoId }) => {
    Todos.remove(todoId);
  }
);
