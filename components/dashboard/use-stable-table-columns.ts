"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Lets the browser choose its natural table proportions, then locks those
 * measured columns so appending rows cannot cause a visible layout shift.
 */
export function useStableTableColumns(isReady: boolean) {
  const tableRef = useRef<HTMLTableElement | null>(null);

  useLayoutEffect(() => {
    if (!isReady) return;
    const table = tableRef.current;
    const container = table?.parentElement;
    if (!table || !container) return;

    const columns = Array.from(table.querySelectorAll("col"));
    const headers = Array.from(table.querySelectorAll("thead th"));
    if (columns.length !== headers.length) return;

    const lockNaturalWidths = () => {
      table.style.tableLayout = "auto";
      for (const column of columns) column.style.width = "";

      const widths = headers.map((header) => header.getBoundingClientRect().width);
      widths.forEach((width, index) => {
        columns[index].style.width = `${width}px`;
      });
      table.style.tableLayout = "fixed";
    };

    lockNaturalWidths();
    let containerWidth = Math.round(container.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = Math.round(entry.contentRect.width);
      if (nextWidth === containerWidth) return;
      containerWidth = nextWidth;
      lockNaturalWidths();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [isReady]);

  return tableRef;
}
