// Shared across the admin catalog screens so invalidation after a mutation
// (e.g. creating an ingredient) always targets the exact key a list screen
// is reading with — a typo'd inline key in one screen wouldn't invalidate
// the other screen's cache.
export const catalogKeys = {
  drinks: ['catalog', 'drinks'] as const,
  drink: (id: string) => ['catalog', 'drinks', id] as const,
  ingredients: ['catalog', 'ingredients'] as const,
};
