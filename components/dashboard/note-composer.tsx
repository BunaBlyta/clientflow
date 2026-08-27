"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";

interface NoteComposerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Resting height of the empty field — one line of text plus its vertical
// padding. The pill's corner radius is always half its height, so at rest
// the caps have a 22px radius and grow from there as the note gets longer.
const MIN_HEIGHT = 44;
// Gap held between the curve of each cap and the text that wraps against it.
const SHAPE_MARGIN = 14;
// Straight segments used to approximate each semicircular cap in the
// shape-outside polygon. 16 is smooth at every height this field reaches.
const ARC_STEPS = 16;

// Builds the shape-outside polygon for one rounded end of the pill: the
// crescent between the field's straight vertical edge and the inner curve
// of the cap. Text flowing around this crescent follows the pill's real
// contour — full width through the middle, tucked in near the caps — and
// re-wraps whenever `height` changes, so the text block reads as a smaller
// pill nested inside the field.
function capPolygon(side: "left" | "right", height: number): string {
  const r = height / 2;
  const points: string[] = [];
  const outerX = side === "left" ? 0 : r;

  points.push(`${outerX}px 0px`);
  for (let step = 0; step <= ARC_STEPS; step += 1) {
    const y = (height * step) / ARC_STEPS;
    const inset = Math.sqrt(Math.max(r * r - (y - r) * (y - r), 0));
    const x = side === "left" ? r - inset : inset;
    points.push(`${x.toFixed(2)}px ${y.toFixed(2)}px`);
  }
  points.push(`${outerX}px ${height.toFixed(2)}px`);

  return `polygon(${points.join(", ")})`;
}

export function NoteComposer({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
}: NoteComposerProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(MIN_HEIGHT);

  // Keep the pill (and its caps) sized to the text. The caps' geometry
  // depends on the height and the height depends on how the text wraps
  // around the caps, so this settles over a frame or two — the 0.5px guard
  // stops it oscillating once it has.
  useEffect(() => {
    const element = editableRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const next = Math.max(MIN_HEIGHT, Math.ceil(element.scrollHeight));
      setHeight((current) => (Math.abs(current - next) > 0.5 ? next : current));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The parent clears `value` once a note has posted. Mirror only that case
  // back into the DOM: while the user types, `value` already equals what is
  // in the field, so writing it back would just fight the caret.
  useEffect(() => {
    const element = editableRef.current;
    if (element && value === "" && element.textContent !== "") {
      element.textContent = "";
      setHeight(MIN_HEIGHT);
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const element = editableRef.current;
    if (element) onChange(element.innerText.replace(/\n$/, ""));
  }, [onChange]);

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain");
      const selection = document.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.getRangeAt(0).deleteContents();
      }
      document.execCommand("insertText", false, text);
      emitChange();
    },
    [emitChange],
  );

  const capStyle = (side: "left" | "right"): CSSProperties => ({
    float: side,
    width: height / 2,
    height,
    shapeOutside: capPolygon(side, height),
    shapeMargin: SHAPE_MARGIN,
  });

  return (
    <div
      className={cn(
        "note-composer relative block w-full overflow-hidden rounded-full border border-input bg-transparent px-1 text-xs transition-colors",
        "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      style={{ minHeight: MIN_HEIGHT }}
      onMouseDown={(event) => {
        if (disabled || event.target === editableRef.current) return;
        // A click anywhere on the pill focuses the field and drops the caret
        // at the end, the way a plain textarea behaves.
        event.preventDefault();
        const element = editableRef.current;
        if (!element) return;
        element.focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        const selection = document.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }}
    >
      <div aria-hidden="true" style={capStyle("left")} />
      <div aria-hidden="true" style={capStyle("right")} />
      <div
        ref={editableRef}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        aria-disabled={disabled || undefined}
        data-placeholder={placeholder}
        contentEditable={disabled ? false : "plaintext-only"}
        suppressContentEditableWarning
        spellCheck
        onInput={emitChange}
        onPaste={handlePaste}
        className={cn(
          "note-composer-field min-h-[inherit] whitespace-pre-wrap break-words py-3 leading-[1.5] outline-none",
          "empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
        )}
      />
    </div>
  );
}
