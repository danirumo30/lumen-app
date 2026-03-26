

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerContext {
  service?: string;
  route?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

class Logger {
  private static isProduction: boolean = process.env.NODE_ENV === "production";
  private static defaultContext: Required<Pick<LoggerContext, "service">> = {
    service: "lumen-app",
  };

  static setDefaultContext(context: Partial<LoggerContext>): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  private static formatArgs(args: unknown[]): { message: string; context?: LoggerContext } {
    if (args.length === 0) {
      return { message: '' };
    }

    const message = String(args[0]);

    if (args.length >= 2) {
      const secondArg = args[1];
      if (
        secondArg !== null && 
        typeof secondArg === 'object' && 
        !(secondArg instanceof Error) && 
        !Array.isArray(secondArg)
      ) {
        return { message, context: secondArg as LoggerContext };
      }
    }

    
    const concatenated = args.map(arg => 
      arg instanceof Error ? arg.message : String(arg)
    ).join(' ');

    return { message: concatenated };
  }

  private static log(level: LogLevel, args: unknown[]): void {
    if (level === "debug" && this.isProduction) {
      return;
    }

    const { message, context } = this.formatArgs(args);
    const mergedContext = { ...this.defaultContext, ...context };
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (this.isProduction) {
      const logEntry = {
        timestamp,
        level,
        message,
        ...mergedContext,
      };
       console[level](JSON.stringify(logEntry));
      return;
    }

    const contextStr = Object.keys(mergedContext).length > 0 
      ? ` | context: ${JSON.stringify(mergedContext, null, 2)}`
      : "";
    
      console[level](`${prefix} ${message}${contextStr}`);
  }

  static debug(...args: unknown[]): void {
    this.log("debug", args);
  }

  static info(...args: unknown[]): void {
    this.log("info", args);
  }

  static warn(...args: unknown[]): void {
    this.log("warn", args);
  }

  static error(...args: unknown[]): void {
    this.log("error", args);
  }


}

export const logger = Logger;
export type { LoggerContext };
export default Logger;

