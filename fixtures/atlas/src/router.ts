export const routes = {
  '/': 'início',
  '/projects': 'projetos',
  '/settings': 'configurações'
};

export function navigate(path: string): string {
  return routes[path as keyof typeof routes] ?? 'não encontrado';
}
