const PREFIX = '[Tukua]';

export const log = {
  info: (scope: string, message: string, extra?: unknown) => {
    if (extra !== undefined) console.log(`${PREFIX}[${scope}] ${message}`, extra);
    else console.log(`${PREFIX}[${scope}] ${message}`);
  },
  warn: (scope: string, message: string, extra?: unknown) => {
    if (extra !== undefined) console.warn(`${PREFIX}[${scope}] ${message}`, extra);
    else console.warn(`${PREFIX}[${scope}] ${message}`);
  },
  error: (scope: string, message: string, extra?: unknown) => {
    if (extra !== undefined) console.error(`${PREFIX}[${scope}] ${message}`, extra);
    else console.error(`${PREFIX}[${scope}] ${message}`);
  },
};
