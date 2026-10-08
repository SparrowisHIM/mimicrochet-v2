/**
 * Stops the page scrolling under a sheet, menu or story without the layout jumping sideways:
 * hiding the scrollbar would widen the page, so its width is added back as padding meanwhile.
 * Returns the unlock. Locks nest: each one restores what was there before it.
 */
export function lockScroll() {
  const root = document.documentElement;
  const prev = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
  const scrollbar = window.innerWidth - root.clientWidth;
  root.style.overflow = "hidden";
  if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
  return () => {
    root.style.overflow = prev.overflow;
    root.style.paddingRight = prev.paddingRight;
  };
}
