import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { getTheme } from "../utils/theme";
import { writeHumn, readHuman } from "../human";
import type { Human } from "../types";
import { arrowLeft, arrowRight, tick, upDownArrow } from "../icons";

type Props = {
  onDone: (message?: string) => void;
};

const GENDERS: Human["gender"][] = ["male", "female", "other"];
const THEMES = ["dark", "light", "system"];

const FIELDS = ["name", "gender", "githubProfile", "defaultTheme"] as const;
type Field = (typeof FIELDS)[number];

const LABELS: Record<Field, string> = {
  name: "your name",
  gender: "gender",
  githubProfile: "github username",
  defaultTheme: "default theme",
};

const HINTS: Record<Field, string> = {
  name: "enter to confirm",
  gender: `${arrowLeft} ${arrowRight} to select · enter to confirm`,
  githubProfile: "enter to confirm",
  defaultTheme: `${arrowLeft} ${arrowRight} to select · enter to confirm`,
};

export function BootstrapWizard({ onDone }: Props): React.ReactNode {
  const theme = getTheme();

  const [step, setStep] = useState(0);
  const [genderIndex, setGenderIndex] = useState(0);
  const [themeIndex, setThemeIndex] = useState(0);
  const [inputBuffer, setInputBuffer] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState<
    Omit<Human, "gender" | "defaultTheme"> & {
      gender: Human["gender"];
      defaultTheme: string;
    }
  >({
    name: "",
    gender: "other",
    githubProfile: "",
    defaultTheme: "dark",
  });

  useInput((input, key) => {
    if (saving) return;
    setError("");

    if (key.escape) {
      onDone();
      return;
    }

    const currentField = FIELDS[step];

    // ── selector fields ──────────────────────────────────────────
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
        setValues((v) => ({ ...v, gender: GENDERS[genderIndex]! }));
        setStep((s) => s + 1);
        setInputBuffer("");
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
        const newValues: Human = {
          ...values,
          defaultTheme: THEMES[themeIndex]!,
        };
        setSaving(true);
        writeHumn(newValues)
          .then(() => onDone(`welcome, ${newValues.name} 👋`))
          .catch((e) => {
            setSaving(false);
            setError(String(e));
          });
        return;
      }
      return;
    }

    // ── text fields ───────────────────────────────────────────────
    if (key.return) {
      if (inputBuffer.trim() === "") {
        setError("this field is required");
        return;
      }
      const newValues = { ...values, [currentField!]: inputBuffer.trim() };
      setValues(newValues);
      setStep((s) => s + 1);
      setInputBuffer("");
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
      {/* header */}
      <Box flexDirection="row" marginBottom={1} gap={2}>
        <Text color={theme.primary}>setup profile</Text>
        <Text color={theme.secondaryText} dimColor>
          esc to cancel
        </Text>
      </Box>

      {/* completed steps */}
      {FIELDS.slice(0, step).map((f) => (
        <Box key={f} flexDirection="row" gap={2} paddingX={1}>
          <Text color={theme.success}>{tick}</Text>
          <Text color={theme.secondaryText}>{LABELS[f]}</Text>
          <Text color={theme.text}>{values[f] || "—"}</Text>
        </Box>
      ))}

      {/* active step */}
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

            {currentField !== "gender" && currentField !== "defaultTheme" && (
              <Text color={theme.text}>{inputBuffer + "█"}</Text>
            )}
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
