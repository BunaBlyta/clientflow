export function upsertById<T extends { id: string }>(items: T[], incoming: T): T[] {
  const index = items.findIndex((item) => item.id === incoming.id);
  if (index === -1) return [...items, incoming];
  if (items[index] === incoming) return items;

  const next = items.slice();
  next[index] = incoming;
  return next;
}
