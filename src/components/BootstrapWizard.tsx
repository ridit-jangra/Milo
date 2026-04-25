import React, { useState } from "react";
import { Box, Text } from "ink";
import { getTheme } from "../utils/theme";
import { writeHuman } from "../human";
import type { Human } from "../types";
import { arrowLeft, arrowRight, tick } from "../icons";
import TextInput from "./TextInput";

type Props = {
  onDone: (message?: string) => void;
  columns: number;
};

const GENDERS: Human["gender"][] = ["male", "female", "other"];
const THEMES = ["dark", "light", "system"];
const COMM_STYLES: NonNullable<Human["communicationStyle"]>[] = [
  "brief",
  "detailed",
];

const FIELDS = [
  "name",
  "gender",
  "githubProfile",
  "defaultTheme",
  "bio",
  "preferredLanguages",
  "editor",
  "communicationStyle",
] as const;
type Field = (typeof FIELDS)[number];

const QUESTIONS: Record<Field, string> = {
  name: "what should i call you? eg. ridit, ridit-jangra, Ridit Jangra",
  gender: "your gender?",
  githubProfile: "github username? eg. ridit-jangra",
  defaultTheme: "preferred theme?",
  bio: "what do you build? eg. clis, web apps, desktop apps, OS (optional)",
  preferredLanguages:
    "languages you use? e.g. typescript, python, english, hindi (optional)",
  editor: "your editor? e.g. vscode (optional)",
  communicationStyle: "how should i talk to you?",
};

const OPTIONAL: Field[] = [
  "bio",
  "preferredLanguages",
  "editor",
  "githubProfile",
];
const SELECTOR: Field[] = ["gender", "defaultTheme", "communicationStyle"];

const OPTIONS: Partial<Record<Field, string[]>> = {
  gender: GENDERS as unknown as string[],
  defaultTheme: THEMES,
  communicationStyle: COMM_STYLES,
};

export function BootstrapWizard({ onDone, columns }: Props): React.ReactNode {
  const theme = getTheme();

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    gender: "other",
    githubProfile: "",
    defaultTheme: "dark",
    bio: "",
    preferredLanguages: "",
    editor: "",
    communicationStyle: "brief",
  });
  const [selectorIndex, setSelectorIndex] = useState<Record<Field, number>>({
    name: 0,
    gender: 0,
    githubProfile: 0,
    defaultTheme: 0,
    bio: 0,
    preferredLanguages: 0,
    editor: 0,
    communicationStyle: 0,
  });
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [cursorOffset, setCursorOffset] = useState(0);

  const currentField = FIELDS[step]!;
  const isSelector = SELECTOR.includes(currentField);
  const opts = OPTIONS[currentField] ?? [];
  const currentSelectorIndex = selectorIndex[currentField];

  function handleSelectorKey(dir: "left" | "right") {
    const max = opts.length - 1;
    const next =
      dir === "left"
        ? Math.max(0, currentSelectorIndex - 1)
        : Math.min(max, currentSelectorIndex + 1);
    setSelectorIndex((s) => ({ ...s, [currentField]: next }));
    setValues((v) => ({ ...v, [currentField]: opts[next]! }));
  }

  function advance(overrides?: Partial<Record<Field, string>>) {
    const finalValues = { ...values, ...overrides };
    if (step === FIELDS.length - 1) {
      setSaving(true);
      const human: Human = {
        name: finalValues.name,
        gender: finalValues.gender as Human["gender"],
        githubProfile: finalValues.githubProfile,
        defaultTheme: finalValues.defaultTheme,
        bio: finalValues.bio || undefined,
        preferredLanguages: finalValues.preferredLanguages
          ? finalValues.preferredLanguages
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        editor: finalValues.editor || undefined,
        communicationStyle:
          finalValues.communicationStyle as Human["communicationStyle"],
      };
      writeHuman(human)
        .then(() => onDone(`welcome, ${human.name} 👋`))
        .catch((e) => {
          setSaving(false);
          setError(String(e));
        });
    } else {
      setValues(finalValues);
      setStep((s) => s + 1);
      setInputValue("");
      setCursorOffset(0);
      setError("");
    }
  }

  function handleTextSubmit(val: string) {
    const trimmed = val.trim();
    if (!OPTIONAL.includes(currentField) && !trimmed) {
      setError("required");
      return;
    }
    advance({ [currentField]: trimmed });
  }

  function handleSelectorSubmit() {
    advance({ [currentField]: opts[currentSelectorIndex]! });
  }

  // For selector fields we need raw key handling — wire into TextInput's onSubmit
  // and intercept arrow keys via onChange hack. Instead, render a dummy TextInput
  // that only listens for enter, and overlay the selector UI above it.

  if (saving) {
    return (
      <Box paddingX={1}>
        <Text color={theme.secondaryText} dimColor>
          saving…
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* completed steps */}
      {FIELDS.slice(0, step).map((f) => (
        <Box key={f} flexDirection="row" gap={2}>
          <Text color={theme.success}>{tick}</Text>
          <Text color={theme.secondaryText} dimColor>
            {QUESTIONS[f]}
          </Text>
          <Text color={theme.text}>{values[f] || "—"}</Text>
        </Box>
      ))}

      {/* current question */}
      <Box flexDirection="column" marginTop={step > 0 ? 1 : 0}>
        <Text color={theme.primary}>{QUESTIONS[currentField]}</Text>

        {isSelector ? (
          <Box flexDirection="column" gap={0} marginTop={0}>
            {/* selector row */}
            <Box flexDirection="row" gap={1} marginTop={0}>
              <Text color={theme.secondaryText} dimColor>
                {arrowLeft}
              </Text>
              {opts.map((opt, i) => (
                <Text
                  key={opt}
                  color={
                    i === currentSelectorIndex
                      ? theme.primary
                      : theme.secondaryText
                  }
                  bold={i === currentSelectorIndex}
                >
                  {opt}
                </Text>
              ))}
              <Text color={theme.secondaryText} dimColor>
                {arrowRight}
              </Text>
            </Box>
            {/* invisible TextInput to capture enter + arrows */}
            <SelectorInput
              onLeft={() => handleSelectorKey("left")}
              onRight={() => handleSelectorKey("right")}
              onSubmit={handleSelectorSubmit}
              onEscape={() => onDone()}
            />
          </Box>
        ) : (
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleTextSubmit}
            onExit={() => onDone()}
            onEscape={() => onDone()}
            columns={columns - 4}
            cursorOffset={cursorOffset}
            onChangeCursorOffset={setCursorOffset}
            placeholder={
              OPTIONAL.includes(currentField) ? "skip with enter" : ""
            }
            focus={true}
          />
        )}

        {error && <Text color={theme.error}>{error}</Text>}
      </Box>
    </Box>
  );
}

// Thin wrapper that captures arrow keys + enter for selector fields
function SelectorInput({
  onLeft,
  onRight,
  onSubmit,
  onEscape,
}: {
  onLeft: () => void;
  onRight: () => void;
  onSubmit: () => void;
  onEscape: () => void;
}): React.ReactNode {
  return (
    <TextInput
      value=""
      onChange={() => {}}
      onSubmit={onSubmit}
      onExit={onEscape}
      onEscape={onEscape}
      columns={1}
      cursorOffset={0}
      onChangeCursorOffset={() => {}}
      placeholder=""
      focus={true}
      onHistoryUp={onRight}
      onHistoryDown={onLeft}
    />
  );
}
