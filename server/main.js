import { publishConnection } from '~/imports/util/rx-meteor';
import { todosConnection } from '~/client/App/meteor';

publishConnection(todosConnection);
