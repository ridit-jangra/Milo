// src/utils/PersistentShell.ts
import * as fs from "fs";
import { homedir } from "os";
import { existsSync } from "fs";
import { spawn, execSync, type ChildProcess } from "child_process";
import { isAbsolute, resolve, join } from "path";
import * as os from "os";

type ExecResult = {
  stdout: string;
  stderr: string;
  code: number;
  interrupted: boolean;
};

type QueuedCommand = {
  command: string;
  abortSignal?: AbortSignal;
  timeout?: number;
  resolve: (result: ExecResult) => void;
  reject: (error: Error) => void;
};

const TEMPFILE_PREFIX = os.tmpdir() + "/vein-";
const DEFAULT_TIMEOUT = 30 * 60 * 1000;
const SIGTERM_CODE = 143;
const FILE_SUFFIXES = {
  STATUS: "-status",
  STDOUT: "-stdout",
  STDERR: "-stderr",
  CWD: "-cwd",
};
const SHELL_CONFIGS: Record<string, string> = {
  "/bin/bash": ".bashrc",
  "/bin/zsh": ".zshrc",
};

export class PersistentShell {
  private commandQueue: QueuedCommand[] = [];
  private isExecuting = false;
  private shell: ChildProcess;
  private isAlive = true;
  private commandInterrupted = false;
  private statusFile: string;
  private stdoutFile: string;
  private stderrFile: string;
  private cwdFile: string;
  private cwd: string;
  private binShell: string;

  constructor(cwd: string) {
    this.binShell =
      process.env.SHELL ||
      (process.platform === "win32" ? "cmd.exe" : "/bin/bash");

    this.shell = spawn(
      process.platform === "win32" ? "cmd.exe" : this.binShell,
      process.platform === "win32" ? [] : ["-l"],
      {
        stdio: ["pipe", "pipe", "pipe"],
        cwd,
        env: { ...process.env, GIT_EDITOR: "true" },
      },
    );

    this.cwd = cwd;

    this.shell.on("exit", (code, signal) => {
      if (code)
        console.error(`Shell exited with code ${code} signal ${signal}`);
      for (const file of [
        this.statusFile,
        this.stdoutFile,
        this.stderrFile,
        this.cwdFile,
      ]) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
      this.isAlive = false;
    });

    const id = Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, "0");
    this.statusFile = TEMPFILE_PREFIX + id + FILE_SUFFIXES.STATUS;
    this.stdoutFile = TEMPFILE_PREFIX + id + FILE_SUFFIXES.STDOUT;
    this.stderrFile = TEMPFILE_PREFIX + id + FILE_SUFFIXES.STDERR;
    this.cwdFile = TEMPFILE_PREFIX + id + FILE_SUFFIXES.CWD;

    for (const file of [this.statusFile, this.stdoutFile, this.stderrFile]) {
      fs.writeFileSync(file, "");
    }
    fs.writeFileSync(this.cwdFile, cwd);

    if (process.platform !== "win32") {
      const configFile = SHELL_CONFIGS[this.binShell];
      if (configFile) {
        const configFilePath = join(homedir(), configFile);
        if (existsSync(configFilePath)) {
          this.sendToShell(`source ${configFilePath}`);
        }
      }
    }
  }

  private static instance: PersistentShell | null = null;

  static getInstance(): PersistentShell {
    if (!PersistentShell.instance || !PersistentShell.instance.isAlive) {
      PersistentShell.instance = new PersistentShell(process.cwd());
    }
    return PersistentShell.instance;
  }

  static restart() {
    if (PersistentShell.instance) {
      PersistentShell.instance.close();
      PersistentShell.instance = null;
    }
  }

  killChildren() {
    const parentPid = this.shell.pid;
    if (!parentPid) return;
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /F /T /PID ${parentPid}`, { stdio: "ignore" });
      } else {
        const childPids = execSync(`pgrep -P ${parentPid}`)
          .toString()
          .trim()
          .split("\n")
          .filter(Boolean);
        childPids.forEach((pid) => {
          try {
            process.kill(Number(pid), "SIGTERM");
          } catch {}
        });
      }
    } catch {
    } finally {
      this.commandInterrupted = true;
    }
  }

  private async processQueue() {
    if (this.isExecuting || this.commandQueue.length === 0) return;
    this.isExecuting = true;
    const { command, abortSignal, timeout, resolve, reject } =
      this.commandQueue.shift()!;
    const killChildren = () => this.killChildren();
    if (abortSignal) abortSignal.addEventListener("abort", killChildren);
    try {
      resolve(await this.exec_(command, timeout));
    } catch (error) {
      reject(error as Error);
    } finally {
      this.isExecuting = false;
      if (abortSignal) abortSignal.removeEventListener("abort", killChildren);
      this.processQueue();
    }
  }

  async exec(
    command: string,
    abortSignal?: AbortSignal,
    timeout?: number,
  ): Promise<ExecResult> {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({
        command,
        abortSignal,
        timeout,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  // simple wrapper for BashTool
  async execute(command: string, timeout?: number): Promise<string> {
    const result = await this.exec(command, undefined, timeout);
    const combined = [result.stdout, result.stderr].filter(Boolean).join("\n");
    return combined;
  }

  private async exec_(command: string, timeout?: number): Promise<ExecResult> {
    const commandTimeout = timeout || DEFAULT_TIMEOUT;
    this.commandInterrupted = false;

    if (process.platform === "win32") {
      return this.execWindows(command, commandTimeout);
    }

    return new Promise<ExecResult>((resolve) => {
      fs.writeFileSync(this.stdoutFile, "");
      fs.writeFileSync(this.stderrFile, "");
      fs.writeFileSync(this.statusFile, "");

      const commandParts = [
        `eval ${JSON.stringify(command)} < /dev/null > ${this.stdoutFile} 2> ${this.stderrFile}`,
        `EXEC_EXIT_CODE=$?`,
        `pwd > ${this.cwdFile}`,
        `echo $EXEC_EXIT_CODE > ${this.statusFile}`,
      ];

      this.sendToShell(commandParts.join("\n"));

      const start = Date.now();
      const checkCompletion = setInterval(() => {
        try {
          const statusSize = fs.existsSync(this.statusFile)
            ? fs.statSync(this.statusFile).size
            : 0;

          if (
            statusSize > 0 ||
            Date.now() - start > commandTimeout ||
            this.commandInterrupted
          ) {
            clearInterval(checkCompletion);
            const stdout = fs.existsSync(this.stdoutFile)
              ? fs.readFileSync(this.stdoutFile, "utf8")
              : "";
            let stderr = fs.existsSync(this.stderrFile)
              ? fs.readFileSync(this.stderrFile, "utf8")
              : "";
            let code: number;
            if (statusSize) {
              code = Number(fs.readFileSync(this.statusFile, "utf8"));
            } else {
              this.killChildren();
              code = SIGTERM_CODE;
              stderr += (stderr ? "\n" : "") + "Command timed out";
            }
            resolve({
              stdout,
              stderr,
              code,
              interrupted: this.commandInterrupted,
            });
          }
        } catch {}
      }, 10);
    });
  }

  private async execWindows(
    command: string,
    timeout: number,
  ): Promise<ExecResult> {
    return new Promise((resolve) => {
      const start = Date.now();
      try {
        const result = execSync(command, {
          timeout,
          encoding: "utf8",
          cwd: this.cwd,
          env: process.env,
        });
        resolve({ stdout: result, stderr: "", code: 0, interrupted: false });
      } catch (err: any) {
        if (Date.now() - start >= timeout) {
          resolve({
            stdout: "",
            stderr: "Command timed out",
            code: SIGTERM_CODE,
            interrupted: true,
          });
        } else {
          resolve({
            stdout: err.stdout || "",
            stderr: err.stderr || String(err),
            code: err.status ?? 1,
            interrupted: false,
          });
        }
      }
    });
  }

  private sendToShell(command: string) {
    this.shell.stdin!.write(command + "\n");
  }

  pwd(): string {
    try {
      const newCwd = fs.readFileSync(this.cwdFile, "utf8").trim();
      if (newCwd) this.cwd = newCwd;
    } catch {}
    return this.cwd;
  }

  async setCwd(cwd: string) {
    const resolved = isAbsolute(cwd) ? cwd : resolve(process.cwd(), cwd);
    if (!existsSync(resolved))
      throw new Error(`Path "${resolved}" does not exist`);
    await this.exec(`cd ${resolved}`);
  }

  close() {
    this.shell.stdin!.end();
    this.shell.kill();
  }
}
