/**
 * Element.scrollIntoView also scrolls every page around an iframe, so when this site is shown inside
 * another page (Efe's portfolio embeds it), the outer page would jump to the frame on its own.
 * Inside a frame this scrolls only this page's window, to where scrollIntoView would have put the
 * element. On its own, the site keeps using the browser's scrollIntoView.
 */
export function scrollToElement(el: Element | null | undefined, options: ScrollIntoViewOptions = {}) {
  if (!el) return;
  if (window.self === window.top) {
    el.scrollIntoView(options);
    return;
  }
  const box = el.getBoundingClientRect();
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const block = options.block ?? "start";
  let top = window.scrollY + box.top - margin;
  if (block === "center") top = window.scrollY + box.top - (window.innerHeight - box.height) / 2;
  else if (block === "end") top = window.scrollY + box.bottom - window.innerHeight;
  else if (block === "nearest") {
    if (box.top >= 0 && box.bottom <= window.innerHeight) return;
    top = box.top < 0 ? window.scrollY + box.top - margin : window.scrollY + box.bottom - window.innerHeight;
  }
  window.scrollTo({ top: Math.max(0, top), behavior: options.behavior ?? "auto" });
}
