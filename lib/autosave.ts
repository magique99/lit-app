export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay = 800
) {
  let t: ReturnType<typeof setTimeout>;

  return (...args: TArgs) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}
