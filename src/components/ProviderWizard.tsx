import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { getTheme } from "../utils/theme";
import {
  addProvider,
  setActiveProvider,
  removeProvider,
  readProviders,
  type ProviderType,
  type ProviderConfig,
} from "../utils/providers";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { arrowLeft, arrowRight, tick, upDownArrow } from "../icons";

type WizardMode = "add" | "edit" | "remove" | "list";

type Props = {
  mode: WizardMode;
  onDone: (message?: string) => void;
};

type ProvidersData = Awaited<ReturnType<typeof readProviders>>;

const PROVIDERS: ProviderType[] = ["groq", "openai", "anthropic", "ollama", "openrouter"];

const FIELDS = ["name", "provider", "model", "apiKey", "baseURL"] as const;
type Field = (typeof FIELDS)[number];

const LABELS: Record<Field, string> = {
  name: "provider name",
  provider: "provider type",
  model: "model id",
  apiKey: "api key",
  baseURL: "base url (optional)",
};

export function ProviderWizard({ mode, onDone }: Props): React.ReactNode {
  const theme = getTheme();
  const [step, setStep] = useState(0);
  const [providerIndex, setProviderIndex] = useState(0);
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    provider: "groq",
    model: "",
    apiKey: "",
    baseURL: "",
  });
  const [inputBuffer, setInputBuffer] = useState("");
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState("");

  React.useEffect(() => {
    readProviders()
      .then((p) => {
        setProviders(p);
        const activeIdx = p.providers.findIndex((x) => x.name === p.active);
        if (activeIdx >= 0) setSelectedIndex(activeIdx);
      })
      .catch(() => {});
  }, []);

  useInput((input, key) => {
    setError("");

    if (key.escape) {
      onDone();
      return;
    }

    if (mode === "remove" || mode === "list") {
      if (!providers) return;
      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((i) =>
          Math.min(providers.providers.length - 1, i + 1),
        );
        return;
      }
      if (key.return) {
        const target = providers.providers[selectedIndex];
        if (!target) return;
        if (mode === "remove") {
          removeProvider(target.name)
            .then(() => onDone(`removed "${target.name}" 🫡`))
            .catch((e) => setError(String(e)));
        } else {
          setActiveProvider(target.name)
            .then(() => onDone(`switched to "${target.name}" 🫡`))
            .catch((e) => setError(String(e)));
        }
        return;
      }
      return;
    }

    if (mode === "add") {
      const currentField = FIELDS[step];

      if (currentField === "provider") {
        if (key.leftArrow) {
          const next = Math.max(0, providerIndex - 1);
          setProviderIndex(next);
          setValues((v) => ({ ...v, provider: PROVIDERS[next]! }));
          return;
        }
        if (key.rightArrow) {
          const next = Math.min(PROVIDERS.length - 1, providerIndex + 1);
          setProviderIndex(next);
          setValues((v) => ({ ...v, provider: PROVIDERS[next]! }));
          return;
        }
        if (key.return) {
          setValues((v) => ({ ...v, provider: PROVIDERS[providerIndex]! }));
          setStep((s) => s + 1);
          setInputBuffer("");
          return;
        }
        return;
      }

      if (key.return) {
        const isOptional =
          currentField === "baseURL" || currentField === "apiKey";
        if (!isOptional && inputBuffer.trim() === "") {
          setError("this field is required");
          return;
        }
        const newValues = { ...values, [currentField!]: inputBuffer.trim() };
        setValues(newValues);

        if (step === FIELDS.length - 1) {
          addProvider({
            name: newValues.name,
            provider: newValues.provider as ProviderType,
            model: newValues.model,
            apiKey: newValues.apiKey || undefined,
            baseURL: newValues.baseURL || undefined,
          })
            .then(() => onDone(`added "${newValues.name}" 🫡`))
            .catch((e) => setError(String(e)));
        } else {
          setStep((s) => s + 1);
          setInputBuffer("");
        }
        return;
      }

      if (key.backspace || key.delete) {
        setInputBuffer((b) => b.slice(0, -1));
        return;
      }

      if (!key.ctrl && !key.meta && input) {
        setInputBuffer((b) => b + input);
      }
    }
  });

  if (mode === "list" || mode === "remove") {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Box flexDirection="row" marginBottom={1} gap={2}>
          <Text color={theme.primary}>
            {mode === "remove" ? "remove provider" : "switch provider"}
          </Text>
          <Text color={theme.secondaryText} dimColor>
            {upDownArrow} select · enter confirm · esc cancel
          </Text>
        </Box>

        <Box flexDirection="column">
          {providers?.providers.map((p: ProviderConfig, i: number) => {
            const isSelected = i === selectedIndex;
            const isActive = p.name === providers.active;
            return (
              <Box key={p.name} flexDirection="row" gap={2} paddingX={1}>
                <Text
                  color={isSelected ? theme.secondary : theme.secondaryText}
                >
                  {isSelected ? arrowRight : " "}
                </Text>
                <Box flexDirection="row" gap={1}>
                  <Text
                    color={isSelected ? theme.secondary : theme.secondaryText}
                  >
                    {p.name}
                  </Text>
                  <Text color={theme.secondaryText} dimColor>
                    {p.provider} · {p.model}
                  </Text>
                  {isActive && <Text color={theme.success}>active</Text>}
                </Box>
              </Box>
            );
          })}
        </Box>

        {error && (
          <Box marginTop={1}>
            <Text color={theme.error}>{error}</Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text color={theme.secondaryText} dimColor>
            {upDownArrow} to select · enter to confirm · esc to cancel
          </Text>
        </Box>
      </Box>
    );
  }

  const currentField = FIELDS[step];

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box flexDirection="row" marginBottom={1} gap={2}>
        <Text color={theme.primary}>add provider</Text>
        <Text color={theme.secondaryText} dimColor>
          esc to cancel
        </Text>
      </Box>

      {FIELDS.slice(0, step).map((f) => (
        <Box key={f} flexDirection="row" gap={2} paddingX={1}>
          <Text color={theme.success}>{tick}</Text>
          <Text color={theme.secondaryText}>{LABELS[f]}</Text>
          <Text color={theme.text}>
            {f === "apiKey" ? "•".repeat(8) : values[f] || "—"}
          </Text>
        </Box>
      ))}

      <Box flexDirection="row" gap={2} paddingX={1} marginTop={1}>
        <Text color={theme.primary}>{arrowRight}</Text>
        <Text color={theme.secondary}>{LABELS[currentField!]}</Text>
        {currentField === "provider" ? (
          <Box flexDirection="row" gap={1}>
            {PROVIDERS.map((p, i) => (
              <Text
                key={p}
                color={i === providerIndex ? theme.error : theme.secondaryText}
              >
                {p}
              </Text>
            ))}
          </Box>
        ) : (
          <Text color={theme.text}>
            {currentField === "apiKey"
              ? "•".repeat(inputBuffer.length) + "█"
              : inputBuffer + "█"}
          </Text>
        )}
      </Box>

      <Box marginTop={1} marginLeft={4}>
        <Text color={theme.secondaryText} dimColor>
          {currentField === "provider"
            ? `${arrowLeft} ${arrowRight} to select · enter to confirm`
            : currentField === "baseURL" || currentField === "apiKey"
              ? "enter to confirm · or skip"
              : "enter to confirm"}
        </Text>
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color={theme.error}>{error}</Text>
        </Box>
      )}
    </Box>
  );
}
