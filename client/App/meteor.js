import { createConnection, createMethod } from '~/imports/util/rx-meteor';
import { find } from '~/imports/util/relation';
import { Todos } from '~/imports/collections';

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
