import { useRef, useState } from "react";
import { type Key } from "ink";
import { Cursor } from "../utils/Cursor";
import {
  getImageFromClipboard,
  CLIPBOARD_ERROR_MESSAGE,
} from "../utils/imagePaste";

const IMAGE_PLACEHOLDER = "[Image pasted]";

type MaybeCursor = void | Cursor;
type InputHandler = (input: string) => MaybeCursor;
type InputMapper = (input: string) => MaybeCursor;

function mapInput(input_map: Array<[string, InputHandler]>): InputMapper {
  return function (input: string): MaybeCursor {
    const handler = new Map(input_map).get(input) ?? (() => {});
    return handler(input);
  };
}

export type UseTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onExit?: () => void;
  onExitMessage?: (show: boolean, key?: string) => void;
  onMessage?: (show: boolean, message?: string) => void;
  onHistoryUp?: () => void;
  onHistoryDown?: () => void;
  onHistoryReset?: () => void;
  onEscape?: () => void;
  mask?: string;
  multiline?: boolean;
  cursorChar: string;
  invert: (text: string) => string;
  columns: number;
  onImagePaste?: (base64Image: string) => void;
  disableCursorMovementForUpDownKeys?: boolean;
  externalOffset: number;
  onOffsetChange: (offset: number) => void;
  disabled?: boolean;
};

export type UseTextInputResult = {
  renderedValue: string;
  onInput: (input: string, key: Key) => void;
  offset: number;
  setOffset: (offset: number) => void;
};

export function useTextInput({
  value: originalValue,
  onChange,
  onSubmit,
  onExit,
  onMessage,
  onHistoryUp,
  onHistoryDown,
  onHistoryReset,
  mask = "",
  multiline = false,
  cursorChar,
  invert,
  columns,
  onImagePaste,
  disableCursorMovementForUpDownKeys = false,
  externalOffset,
  onOffsetChange,
  onEscape,
  disabled,
}: UseTextInputProps): UseTextInputResult {
  const setOffset = onOffsetChange;

  const lastEmittedRef = useRef({ text: originalValue, offset: externalOffset });
  const workingRef = useRef({ text: originalValue, offset: externalOffset });

  // If the props no longer match what we last emitted, an external change
  // occurred (history navigation, clear, paste, …). Adopt it as the new baseline.
  if (
    originalValue !== lastEmittedRef.current.text ||
    externalOffset !== lastEmittedRef.current.offset
  ) {
    workingRef.current = { text: originalValue, offset: externalOffset };
    lastEmittedRef.current = { text: originalValue, offset: externalOffset };
  }

  const offset = workingRef.current.offset;
  const cursor = Cursor.fromText(
    workingRef.current.text,
    columns,
    workingRef.current.offset,
  );
  const [imagePasteErrorTimeout, setImagePasteErrorTimeout] =
    useState<NodeJS.Timeout | null>(null);

  function maybeClearImagePasteErrorTimeout() {
    if (!imagePasteErrorTimeout) return;
    clearTimeout(imagePasteErrorTimeout);
    setImagePasteErrorTimeout(null);
    onMessage?.(false);
  }

  function commit(text: string, nextOffset: number) {
    workingRef.current = { text, offset: nextOffset };
    lastEmittedRef.current = { text, offset: nextOffset };
  }

  function handleCtrlC() {
    maybeClearImagePasteErrorTimeout();
    if (workingRef.current.text) {
      commit("", 0);
      onChange("");
      onHistoryReset?.();
    } else {
      onExit?.();
    }
  }

  function handleEscape() {
    maybeClearImagePasteErrorTimeout();
    if (workingRef.current.text) {
      commit("", 0);
      onChange("");
    }
    onEscape?.();
  }

  function clear() {
    return Cursor.fromText("", columns, 0);
  }

  // All cursor transformations are built against the cursor passed in, so a
  // burst of keystrokes can each operate on the freshest working state rather
  // than a stale render-time snapshot.
  function mapKey(cursor: Cursor, key: Key): InputMapper {
    function handleCtrlD(): MaybeCursor {
      maybeClearImagePasteErrorTimeout();
      if (cursor.text === "") {
        onExit?.();
        return cursor;
      }
      return cursor.del();
    }

    function tryImagePaste(): MaybeCursor {
      const base64Image = getImageFromClipboard();
      if (base64Image === null) {
        if (process.platform !== "darwin") return cursor;
        onMessage?.(true, CLIPBOARD_ERROR_MESSAGE);
        maybeClearImagePasteErrorTimeout();
        setImagePasteErrorTimeout(
          setTimeout(() => {
            onMessage?.(false);
          }, 4000),
        );
        return cursor;
      }
      onImagePaste?.(base64Image);
      return cursor.insert(IMAGE_PLACEHOLDER);
    }

    function upOrHistoryUp(): MaybeCursor {
      if (disableCursorMovementForUpDownKeys) {
        onHistoryUp?.();
        return cursor;
      }
      const cursorUp = cursor.up();
      if (cursorUp.equals(cursor)) onHistoryUp?.();
      return cursorUp;
    }

    function downOrHistoryDown(): MaybeCursor {
      if (disableCursorMovementForUpDownKeys) {
        onHistoryDown?.();
        return cursor;
      }
      const cursorDown = cursor.down();
      if (cursorDown.equals(cursor)) onHistoryDown?.();
      return cursorDown;
    }

    const handleCtrl = mapInput([
      ["a", () => cursor.startOfLine()],
      ["b", () => cursor.left()],
      [
        "c",
        () => {
          handleCtrlC();
          return cursor;
        },
      ],
      ["d", handleCtrlD],
      ["e", () => cursor.endOfLine()],
      ["f", () => cursor.right()],
      ["h", () => cursor.backspace()],
      ["k", () => cursor.deleteToLineEnd()],
      ["l", () => clear()],
      ["n", () => downOrHistoryDown()],
      ["p", () => upOrHistoryUp()],
      ["u", () => cursor.deleteToLineStart()],
      ["v", tryImagePaste],
      ["w", () => cursor.deleteWordBefore()],
    ]);

    const handleMeta = mapInput([
      ["b", () => cursor.prevWord()],
      ["f", () => cursor.nextWord()],
      ["d", () => cursor.deleteWordAfter()],
    ]);

    function handleEnter(key: Key): MaybeCursor {
      if (
        multiline &&
        cursor.offset > 0 &&
        cursor.text[cursor.offset - 1] === "\\"
      ) {
        return cursor.backspace().insert("\n");
      }
      if (key.meta) return cursor.insert("\n");
      if (!disabled) onSubmit?.(cursor.text);
    }

    switch (true) {
      case key.escape:
        return () => {
          handleEscape();
          return cursor;
        };
      case key.leftArrow && (key.ctrl || key.meta):
        return () => cursor.prevWord();
      case key.rightArrow && (key.ctrl || key.meta):
        return () => cursor.nextWord();
      case key.backspace || key.delete:
        return key.meta
          ? () => cursor.deleteWordBefore()
          : () => cursor.backspace();
      case key.delete:
        return key.meta ? () => cursor.deleteToLineEnd() : () => cursor.del();
      case key.ctrl:
        return handleCtrl;
      case key.home:
        return () => cursor.startOfLine();
      case key.end:
        return () => cursor.endOfLine();
      case key.pageDown:
        return () => cursor.endOfLine();
      case key.pageUp:
        return () => cursor.startOfLine();
      case key.meta:
        return handleMeta;
      case key.return:
        return () => handleEnter(key);
      case key.tab:
        return () => {};
      case key.upArrow:
        return upOrHistoryUp;
      case key.downArrow:
        return downOrHistoryDown;
      case key.leftArrow:
        return () => cursor.left();
      case key.rightArrow:
        return () => cursor.right();
    }
    return function (input: string) {
      switch (true) {
        case input === "\x1b[H" || input === "\x1b[1~":
          return cursor.startOfLine();
        case input === "\x1b[F" || input === "\x1b[4~":
          return cursor.endOfLine();
        default:
          return cursor.insert(input.replace(/\r/g, "\n"));
      }
    };
  }

  function onInput(input: string, key: Key): void {
    // Rebuild the cursor from the synchronous working state so consecutive
    // keystrokes in a fast burst each see the previous keystroke's result.
    const liveCursor = Cursor.fromText(
      workingRef.current.text,
      columns,
      workingRef.current.offset,
    );
    const nextCursor = mapKey(liveCursor, key)(input);
    if (nextCursor) {
      if (!liveCursor.equals(nextCursor)) {
        commit(nextCursor.text, nextCursor.offset);
        setOffset(nextCursor.offset);
        if (liveCursor.text !== nextCursor.text) {
          onChange(nextCursor.text);
        }
      }
    }
  }

  return {
    onInput,
    renderedValue: cursor.render(cursorChar, mask, invert),
    offset,
    setOffset,
  };
}
