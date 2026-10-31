export function createStore<T extends object>(initial: T) {
  let state = { ...initial };
  return {
    get value() { return { ...state }; },
    update(patch: Partial<T>) { state = { ...state, ...patch }; }
  };
}
