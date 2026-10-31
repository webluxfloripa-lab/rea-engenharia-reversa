export const fixture = [
 {path:'src/app.ts',content:`import { navigate, routes } from './router';\nimport { createStore } from './store';\n\n// Atlas: aplicação fictícia e autoral para investigação.\nconst store = createStore({ page: 'início', visits: 0 });\n\nexport function startApp(path: string) {\n  const page = navigate(path);\n  store.update({ page, visits: store.value.visits + 1 });\n  return { page, routes, state: store.value };\n}\n`},
 {path:'src/router.ts',content:`export const routes = {\n  '/': 'início',\n  '/projects': 'projetos',\n  '/settings': 'configurações'\n};\n\nexport function navigate(path: string): string {\n  return routes[path as keyof typeof routes] ?? 'não encontrado';\n}\n`},
 {path:'src/store.ts',content:`export function createStore<T extends object>(initial: T) {\n  let state = { ...initial };\n  return {\n    get value() { return { ...state }; },\n    update(patch: Partial<T>) { state = { ...state, ...patch }; }\n  };\n}\n`},
 {path:'README.md',content:'# Atlas / fixture autorizada\n\nCódigo autoral demonstrativo do REA Studio. Licença MIT.\nTrês módulos: aplicação, roteamento e estado. Não contém dados reais.\n'}
];
