export function debounce(fn: Function, delay = 800) {
  let t: any;

  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}