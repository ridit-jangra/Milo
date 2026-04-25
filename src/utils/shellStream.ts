import { EventEmitter } from "events";

const KEY = "__milo_shell_stream__";

if (!(process as any)[KEY]) {
  (process as any)[KEY] = new EventEmitter();
}

export const shellStream: EventEmitter = (process as any)[KEY];
