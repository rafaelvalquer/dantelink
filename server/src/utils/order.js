export function sortByOrder(items = []) {
  return [...items].sort((left, right) => {
    const leftOrder = Number(left?.order ?? 0);
    const rightOrder = Number(right?.order ?? 0);
    return leftOrder - rightOrder;
  });
}

export function normalizeOrder(items = []) {
  return sortByOrder(items).map((item, index) => ({
    ...item,
    order: index,
  }));
}

export function applyOrderByIds(items = [], ids = []) {
  const stringIds = ids.map(String);
  const map = new Map(items.map((item) => [String(item.id), item]));
  const selected = stringIds.map((id) => map.get(id)).filter(Boolean);
  const remaining = items.filter((item) => !stringIds.includes(String(item.id)));

  return normalizeOrder([...selected, ...sortByOrder(remaining)]);
}
