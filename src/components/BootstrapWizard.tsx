import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { getTheme } from "../utils/theme";
import { writeHuman, readHuman } from "../human";
import type { Human } from "../types";
import { arrowLeft, arrowRight, tick, upDownArrow } from "../icons";

type Props = {
  onDone: (message?: string) => void;
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
  "timezone",
] as const;
type Field = (typeof FIELDS)[number];

const LABELS: Record<Field, string> = {
  name: "your name",
  gender: "gender",
  githubProfile: "github username",
  defaultTheme: "default theme",
  bio: "about you",
  preferredLanguages: "preferred languages",
  editor: "your editor",
  communicationStyle: "communication style",
  timezone: "timezone",
};

const HINTS: Record<Field, string> = {
  name: "enter to confirm",
  gender: `${arrowLeft} ${arrowRight} to select · enter to confirm`,
  githubProfile: "enter your github username to sync repos · or skip",
  defaultTheme: `${arrowLeft} ${arrowRight} to select · enter to confirm`,
  bio: "what you build, your interests · enter to confirm · or skip",
  preferredLanguages:
    "comma separated e.g. typescript, python · enter to confirm · or skip",
  editor: "e.g. meridia, vscode · enter to confirm · or skip",
  communicationStyle: `${arrowLeft} ${arrowRight} to select · enter to confirm`,
  timezone: "e.g. Asia/Kolkata · enter to confirm · or skip",
};

const OPTIONAL_FIELDS: Field[] = [
  "bio",
  "preferredLanguages",
  "editor",
  "timezone",
  "githubProfile",
];

export function BootstrapWizard({ onDone }: Props): React.ReactNode {
  const theme = getTheme();

  const [step, setStep] = useState(0);
  const [genderIndex, setGenderIndex] = useState(0);
  const [themeIndex, setThemeIndex] = useState(0);
  const [commIndex, setCommIndex] = useState(0);
  const [inputBuffer, setInputBuffer] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    gender: "other",
    githubProfile: "",
    defaultTheme: "dark",
    bio: "",
    preferredLanguages: "",
    editor: "",
    communicationStyle: "brief",
    timezone: "",
  });

  function finish(finalValues: Record<Field, string>) {
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
        (finalValues.communicationStyle as Human["communicationStyle"]) ||
        undefined,
      timezone: finalValues.timezone || undefined,
    };
    writeHuman(human)
      .then(() => onDone(`welcome, ${human.name} 👋`))
      .catch((e) => {
        setSaving(false);
        setError(String(e));
      });
  }

  function nextStep(overrideValues?: Record<Field, string>) {
    const v = overrideValues ?? values;
    if (step === FIELDS.length - 1) {
      finish(v);
    } else {
      setStep((s) => s + 1);
      setInputBuffer("");
    }
  }

  useInput((input, key) => {
    if (saving) return;
    setError("");

    if (key.escape) {
      onDone();
      return;
    }

    const currentField = FIELDS[step];

    if (currentField === "gender") {
      if (key.leftArrow) {
        const next = Math.max(0, genderIndex - 1);
        setGenderIndex(next);
        setValues((v) => ({ ...v, gender: GENDERS[next]! }));
        return;
      }
      if (key.rightArrow) {
        const next = Math.min(GENDERS.length - 1, genderIndex + 1);
        setGenderIndex(next);
        setValues((v) => ({ ...v, gender: GENDERS[next]! }));
        return;
      }
      if (key.return) {
        const updated = { ...values, gender: GENDERS[genderIndex]! };
        setValues(updated);
        nextStep(updated);
        return;
      }
      return;
    }

    if (currentField === "defaultTheme") {
      if (key.leftArrow) {
        const next = Math.max(0, themeIndex - 1);
        setThemeIndex(next);
        setValues((v) => ({ ...v, defaultTheme: THEMES[next]! }));
        return;
      }
      if (key.rightArrow) {
        const next = Math.min(THEMES.length - 1, themeIndex + 1);
        setThemeIndex(next);
        setValues((v) => ({ ...v, defaultTheme: THEMES[next]! }));
        return;
      }
      if (key.return) {
        const updated = { ...values, defaultTheme: THEMES[themeIndex]! };
        setValues(updated);
        nextStep(updated);
        return;
      }
      return;
    }

    if (currentField === "communicationStyle") {
      if (key.leftArrow) {
        const next = Math.max(0, commIndex - 1);
        setCommIndex(next);
        setValues((v) => ({ ...v, communicationStyle: COMM_STYLES[next]! }));
        return;
      }
      if (key.rightArrow) {
        const next = Math.min(COMM_STYLES.length - 1, commIndex + 1);
        setCommIndex(next);
        setValues((v) => ({ ...v, communicationStyle: COMM_STYLES[next]! }));
        return;
      }
      if (key.return) {
        const updated = {
          ...values,
          communicationStyle: COMM_STYLES[commIndex]!,
        };
        setValues(updated);
        nextStep(updated);
        return;
      }
      return;
    }

    // text fields
    if (key.return) {
      const isOptional = OPTIONAL_FIELDS.includes(currentField!);
      if (!isOptional && inputBuffer.trim() === "") {
        setError("this field is required");
        return;
      }
      const updated = { ...values, [currentField!]: inputBuffer.trim() };
      setValues(updated);
      nextStep(updated);
      return;
    }

    if (key.backspace || key.delete) {
      setInputBuffer((b) => b.slice(0, -1));
      return;
    }

    if (!key.ctrl && !key.meta && input) {
      setInputBuffer((b) => b + input);
    }
  });

  const currentField = FIELDS[step];

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box flexDirection="row" marginBottom={1} gap={2}>
        <Text color={theme.primary}>setup profile</Text>
        <Text color={theme.secondaryText} dimColor>
          esc to cancel
        </Text>
      </Box>

      {FIELDS.slice(0, step).map((f) => (
        <Box key={f} flexDirection="row" gap={2} paddingX={1}>
          <Text color={theme.success}>{tick}</Text>
          <Text color={theme.secondaryText}>{LABELS[f]}</Text>
          <Text color={theme.text}>{values[f] || "—"}</Text>
        </Box>
      ))}

      {!saving && currentField && (
        <>
          <Box flexDirection="row" gap={2} paddingX={1} marginTop={1}>
            <Text color={theme.primary}>{arrowRight}</Text>
            <Text color={theme.secondary}>{LABELS[currentField]}</Text>

            {currentField === "gender" && (
              <Box flexDirection="row" gap={1}>
                {GENDERS.map((g, i) => (
                  <Text
                    key={g}
                    color={
                      i === genderIndex ? theme.error : theme.secondaryText
                    }
                  >
                    {g}
                  </Text>
                ))}
              </Box>
            )}

            {currentField === "defaultTheme" && (
              <Box flexDirection="row" gap={1}>
                {THEMES.map((t, i) => (
                  <Text
                    key={t}
                    color={i === themeIndex ? theme.error : theme.secondaryText}
                  >
                    {t}
                  </Text>
                ))}
              </Box>
            )}

            {currentField === "communicationStyle" && (
              <Box flexDirection="row" gap={1}>
                {COMM_STYLES.map((c, i) => (
                  <Text
                    key={c}
                    color={i === commIndex ? theme.error : theme.secondaryText}
                  >
                    {c}
                  </Text>
                ))}
              </Box>
            )}

            {!["gender", "defaultTheme", "communicationStyle"].includes(
              currentField,
            ) && <Text color={theme.text}>{inputBuffer + "█"}</Text>}
          </Box>

          <Box marginTop={1} marginLeft={4}>
            <Text color={theme.secondaryText} dimColor>
              {HINTS[currentField]}
            </Text>
          </Box>
        </>
      )}

      {saving && (
        <Box marginTop={1} paddingX={1}>
          <Text color={theme.secondaryText} dimColor>
            saving…
          </Text>
        </Box>
      )}

      {error && (
        <Box marginTop={1}>
          <Text color={theme.error}>{error}</Text>
        </Box>
      )}
    </Box>
  );
}
