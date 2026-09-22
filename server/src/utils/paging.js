// { rows, total, page, limit } -> { data, pagination } API shape.
export function pageOut(result) {
  const { rows, total, page, limit } = result;
  return { data: rows, pagination: { page, limit, total } };
}
