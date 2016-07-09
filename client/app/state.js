import { createConnectionStream } from '~/util/rx-meteor';
import { defineEvent } from '~/util/rx-react';
import { todosConnection, addTodo, deleteTodo } from '~/meteor/todos';
import 'rxjs';

export const createState = (propsStream, actionsStream, listen) => {
  const onAddTodo = defineEvent(actionsStream, 'addTodo');
  const onChangePost = defineEvent(actionsStream, 'changePost');
  const onDeleteTodo = defineEvent(actionsStream, 'deleteTodo');

  const todosStream = createConnectionStream(todosConnection, propsStream);
  listen(todosStream);

  const postStream = onChangePost
    .scan((post, event) => Object.assign({}, post, { [event.target.name]: event.target.value }), {})
    .startWith({})
    .merge(onAddTodo.mapTo({}).debounceTime(0));
  listen(postStream.map(post => ({ post })));

  const addTodoResultStream = onAddTodo
    .withLatestFrom(postStream)
    .map(([, data]) => ({ data }))
    .filter(({ data }) => !!data.text)
    .switchMap(addTodo);
  listen(addTodoResultStream.ignoreElements());

  const deleteTodoResultStream = onDeleteTodo
    .map(todoId => ({ todoId }))
    .switchMap(deleteTodo);
  listen(deleteTodoResultStream.ignoreElements());
};
