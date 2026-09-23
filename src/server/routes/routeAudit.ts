export type RouteDefinition = {
  method: string;
  path: string;
  file: string;
  index: number;
};

const EXPRESS_ROUTE_PATTERN = /\b(?:app|router)\s*\.\s*(get|post|put|delete|patch|options|all)\s*\(\s*(['"`])([^'"`]+)\2/g;

export function extractExpressRouteDefinitions(source: string, file: string): RouteDefinition[] {
  return Array.from(source.matchAll(EXPRESS_ROUTE_PATTERN), (match) => ({
    method: match[1].toUpperCase(),
    path: match[3],
    file,
    index: match.index ?? 0,
  }));
}

export function findDuplicateExpressRoutes(routes: RouteDefinition[]) {
  const seen = new Map<string, RouteDefinition>();
  const duplicates: Array<{ key: string; first: RouteDefinition; duplicate: RouteDefinition }> = [];

  for (const route of routes) {
    const key = `${route.method} ${route.path}`;
    const first = seen.get(key);
    if (first) {
      duplicates.push({ key, first, duplicate: route });
    } else {
      seen.set(key, route);
    }
  }

  return duplicates;
}
