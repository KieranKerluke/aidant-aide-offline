interface Process {
  stdout: {
    isTTY: boolean;
    write: (...args: any[]) => void;
    columns: number;
    getColorDepth: () => number;
    hasColors: () => boolean;
  };
  stderr: {
    isTTY: boolean;
    write: (...args: any[]) => void;
    getColorDepth: () => number;
    hasColors: () => boolean;
  };
  env: {
    NODE_ENV: string;
    DEBUG: string;
    GOOGLE_SDK_NODE_LOGGING: boolean;
    [key: string]: string | boolean | undefined;
  };
  version: string;
}

declare global {
  interface Window {
    process: Process;
  }
}

export {}; 