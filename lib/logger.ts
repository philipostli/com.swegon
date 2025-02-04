type LogFunction = (...args: any[]) => void;

class Logger {
  private _log: LogFunction;

  private _error: LogFunction;

  private debugMode: boolean;

  constructor(log: LogFunction, error: LogFunction, debugMode: boolean) {
    this._log = log;
    this._error = error;
    this.debugMode = debugMode;
  }

  public debug(...args: any[]): void {
    if (this.debugMode === true) {
      this._log(...args);
    }
  }

  public info(...args: any[]): void {
    this._log(...args);
  }

  public error(...args: any[]): void {
    this._error(...args);
  }
}

export default Logger;
