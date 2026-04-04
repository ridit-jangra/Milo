import { marked } from "marked";
import type { Token } from "marked";
import chalk from "chalk";
import { EOL } from "os";
import { highlight, supportsLanguage } from "cli-highlight";
import { cornerTopLeft, cornerBottomLeft, lineVertical, line } from "../icons";

const STRIPPED_TAGS = [
  "commit_analysis",
  "context",
  "function_analysis",
  "pr_analysis",
];

export function stripSystemMessages(content: string): string {
  const regex = new RegExp(`<(${STRIPPED_TAGS.join("|")})>.*?</\\1>\n?`, "gs");
  return content.replace(regex, "").trim();
}

export function applyMarkdown(content: string): string {
  return marked
    .lexer(stripSystemMessages(content))
    .map((_) => format(_))
    .join("")
    .trim();
}

function formatCodeBlock(text: string, lang?: string): string {
  const highlighted =
    lang && supportsLanguage(lang)
      ? highlight(text, { language: lang })
      : highlight(text, { language: "markdown" });

  const lines = highlighted.split("\n");
  const top =
    chalk.dim(cornerTopLeft + line) + (lang ? chalk.dim(` ${lang}`) : "");
  const body = lines.map((l) => chalk.dim(lineVertical + " ") + l).join(EOL);
  const bottom = chalk.dim(cornerBottomLeft + line);

  return top + EOL + body + EOL + bottom + EOL;
}

function format(
  token: Token,
  listDepth = 0,
  orderedListNumber: number | null = null,
  parent: Token | null = null,
): string {
  switch (token.type) {
    case "blockquote":
      return chalk.dim.italic(
        (token.tokens ?? []).map((_) => format(_)).join(""),
      );
    case "code":
      return formatCodeBlock(token.text, token.lang);
    case "codespan":
      return chalk.blue(token.text);
    case "em":
      return chalk.italic((token.tokens ?? []).map((_) => format(_)).join(""));
    case "strong":
      return chalk.bold((token.tokens ?? []).map((_) => format(_)).join(""));
    case "heading":
      switch (token.depth) {
        case 1:
          return (
            chalk.bold.italic.underline(
              (token.tokens ?? []).map((_) => format(_)).join(""),
            ) +
            EOL +
            EOL
          );
        case 2:
          return (
            chalk.bold((token.tokens ?? []).map((_) => format(_)).join("")) +
            EOL +
            EOL
          );
        default:
          return (
            chalk.bold.dim(
              (token.tokens ?? []).map((_) => format(_)).join(""),
            ) +
            EOL +
            EOL
          );
      }
    case "hr":
      return "---";
    case "image":
      return `[Image: ${token.title}: ${token.href}]`;
    case "link":
      return chalk.blue(token.href);
    case "list": {
      return token.items
        .map((_: Token, index: number) =>
          format(
            _,
            listDepth,
            token.ordered ? token.start + index : null,
            token,
          ),
        )
        .join("");
    }
    case "list_item":
      return (token.tokens ?? [])
        .map(
          (_) =>
            `${"  ".repeat(listDepth)}${format(_, listDepth + 1, orderedListNumber, token)}`,
        )
        .join("");
    case "paragraph":
      return (token.tokens ?? []).map((_) => format(_)).join("") + EOL;
    case "space":
      return EOL;
    case "text":
      if (parent?.type === "list_item") {
        return `${orderedListNumber === null ? "-" : getListNumber(listDepth, orderedListNumber) + "."} ${token.tokens ? token.tokens.map((_) => format(_, listDepth, orderedListNumber, token)).join("") : token.text}${EOL}`;
      } else {
        return token.text;
      }
    case "table": {
      const headers = (token.header as any[]).map((h: any) =>
        ((h.tokens ?? []) as Token[]).map((_) => format(_)).join(""),
      );
      const rows = (token.rows as any[][]).map((row: any[]) =>
        row.map((cell: any) =>
          ((cell.tokens ?? []) as Token[]).map((_) => format(_)).join(""),
        ),
      );

      const colWidths = headers.map((h: string, i: number) =>
        Math.max(h.length, ...rows.map((r: string[]) => (r[i] ?? "").length)),
      );

      const formatRow = (cells: string[]) =>
        cells.map((c, i) => c.padEnd(colWidths[i] ?? 0)).join("  ");

      const header = chalk.bold(formatRow(headers));
      const separator = colWidths.map((w: number) => "─".repeat(w)).join("  ");
      const body = rows.map((r: string[]) => formatRow(r)).join(EOL);

      return header + EOL + chalk.dim(separator) + EOL + body + EOL;
    }
  }
  return "";
}

const DEPTH_1_LIST_NUMBERS = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "aa",
  "ab",
  "ac",
  "ad",
  "ae",
  "af",
  "ag",
  "ah",
  "ai",
  "aj",
  "ak",
  "al",
  "am",
  "an",
  "ao",
  "ap",
  "aq",
  "ar",
  "as",
  "at",
  "au",
  "av",
  "aw",
  "ax",
  "ay",
  "az",
];
const DEPTH_2_LIST_NUMBERS = [
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "vii",
  "viii",
  "ix",
  "x",
  "xi",
  "xii",
  "xiii",
  "xiv",
  "xv",
  "xvi",
  "xvii",
  "xviii",
  "xix",
  "xx",
  "xxi",
  "xxii",
  "xxiii",
  "xxiv",
  "xxv",
  "xxvi",
  "xxvii",
  "xxviii",
  "xxix",
  "xxx",
  "xxxi",
  "xxxii",
  "xxxiii",
  "xxxiv",
  "xxxv",
  "xxxvi",
  "xxxvii",
  "xxxviii",
  "xxxix",
  "xl",
];

function getListNumber(listDepth: number, orderedListNumber: number): string {
  switch (listDepth) {
    case 0:
    case 1:
      return orderedListNumber.toString();
    case 2:
      return DEPTH_1_LIST_NUMBERS[orderedListNumber - 1]!;
    case 3:
      return DEPTH_2_LIST_NUMBERS[orderedListNumber - 1]!;
    default:
      return orderedListNumber.toString();
  }
}
