export function isTableRowInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(
    target.closest("a, button, input, select, textarea, [role='button'], [role='menuitem']"),
  );
}
