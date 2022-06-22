// dom 属性操作

import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

// null  值
// 值    值
// 值    null
export function patchProp(el, key, prevValue, nextValue) {
  // 类名 el.classname
  if (key === "class") {
    patchClass(el, nextValue);

    // el.style {color: 'red' } {color: 'green'}
  } else if (key === "style") {
    // el.style
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
}
