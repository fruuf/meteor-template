import { Todos } from './collections';
import { createConnection, createMethod } from '~/util/rx-meteor';
import { find } from '~/util/relations';

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
