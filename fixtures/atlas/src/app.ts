import { navigate, routes } from './router';
import { createStore } from './store';

// Atlas: aplicação fictícia e autoral para investigação.
const store = createStore({ page: 'início', visits: 0 });

export function startApp(path: string) {
  const page = navigate(path);
  store.update({ page, visits: store.value.visits + 1 });
  return { page, routes, state: store.value };
}
