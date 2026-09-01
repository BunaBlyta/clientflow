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

// Resting height of the empty field. Short notes use a pill shape; once the
// content grows beyond one line, the field switches to a compact rectangle.
const MIN_HEIGHT = 44;
// Baseline inset of every line of text from the field's edge. The caret and
// the placeholder both sit here too, so an empty field reads as one point
// rather than a caret on the far left and placeholder text further in.
const EDGE_INSET = 14;
// Straight segments used to approximate each semicircular cap.
const ARC_STEPS = 16;

// Builds the shape-outside polygon for one rounded end: the slice of the
// cap's inner curve that reaches past EDGE_INSET, in the float's own
// coordinates. The text block is centred in the field, so a float of height
// `contentHeight` sits `offset` below the top of a `pillHeight`-tall pill —
// map local y through that offset before measuring the curve, and measure it
// against the pill's real radius so the text edge tracks the visible curve.
function capPolygon(
  side: "left" | "right",
  contentHeight: number,
  pillHeight: number,
): string {
  const radius = pillHeight / 2;
  const offset = (pillHeight - contentHeight) / 2;
  const outerX = side === "left" ? 0 : radius;
  const points: string[] = [`${outerX}px 0px`];

  for (let step = 0; step <= ARC_STEPS; step += 1) {
    const localY = (contentHeight * step) / ARC_STEPS;
    const centreGap = localY + offset - radius;
    const capInset = radius - Math.sqrt(Math.max(radius * radius - centreGap * centreGap, 0));
    const x = side === "left" ? capInset : radius - capInset;
    points.push(`${x.toFixed(2)}px ${localY.toFixed(2)}px`);
  }

  points.push(`${outerX}px ${contentHeight.toFixed(2)}px`);
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
  const [contentHeight, setContentHeight] = useState(0);
  const pillHeight = Math.max(MIN_HEIGHT, contentHeight);
  // Keep the pill for one line, then switch to a square as soon as the text
  // wraps or the user inserts a line break.
  const isMultiline = contentHeight > 24 || value.includes("\n");

  // Keep the caps sized to the text block as the note grows. The caps'
  // geometry follows the height and the height follows how the text wraps
  // around the caps, so this settles over a frame or two — the 0.5px guard
  // stops it oscillating once it has.
  useEffect(() => {
    const element = editableRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const next = Math.ceil(element.scrollHeight);
      setContentHeight((current) => (Math.abs(current - next) > 0.5 ? next : current));
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
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const element = editableRef.current;
    if (element) {
      const nextValue = element.innerText.replace(/\n$/, "");
      if (!nextValue) setContentHeight(0);
      onChange(nextValue);
    }
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
    width: pillHeight / 2,
    height: contentHeight,
    shapeOutside: capPolygon(side, contentHeight, pillHeight),
    shapeMargin: 0,
  });

  return (
    <div
      className={cn(
        "note-composer relative flex w-full items-center overflow-hidden border border-input bg-transparent px-1 text-xs transition-colors",
        "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      style={{
        minHeight: MIN_HEIGHT,
        borderRadius: isMultiline ? 6 : 9999,
      }}
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
      <div className="w-full" style={{ display: "flow-root" }}>
        {!isMultiline && (
          <>
            <div aria-hidden="true" style={capStyle("left")} />
            <div aria-hidden="true" style={capStyle("right")} />
          </>
        )}
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
          style={{
            paddingInline: isMultiline ? 12 : EDGE_INSET,
            paddingBlock: isMultiline ? 10 : 0,
          }}
          className={cn(
            "note-composer-field whitespace-pre-wrap break-words leading-[1.5] outline-none",
            "empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
          )}
        />
      </div>
    </div>
  );
}
