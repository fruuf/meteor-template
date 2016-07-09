import { publishConnection } from '~/util/rx-meteor';
import { todosConnection } from '~/meteor/todos';

publishConnection(todosConnection);
