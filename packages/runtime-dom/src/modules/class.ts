export function patchClass(el, nextValue) {
  if (nextValue == null) {
    el.removeAttribute("class"); // 如果不需要class，直接移出
  } else {
    el.className = nextValue;
  }
}
