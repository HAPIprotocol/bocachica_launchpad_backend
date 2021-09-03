const DEFAULT_RETRY_INTERVAL = 1000;
const DEFAULT_RETRY_TIMEOUT = 10000;
const DEFAULT_MAX_ATTEMPTS = 10;

export enum RetryUntilSuccessStrategy {
  Fixed,
  Linear,
  Exponential,
}

export interface RetryUntilSuccessOptions {
  interval?: number;
  timeout?: number;
  maxAttempts?: number;
  onErrorRetry?: (err?: Error) => boolean;
  strategy?: RetryUntilSuccessStrategy;
}

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryUntilSuccess<T>(
  fn: () => Promise<T>,
  options?: RetryUntilSuccessOptions,
): Promise<T> {
  if (!options) {
    options = {};
  }
  if (options.interval === undefined) {
    options.interval = DEFAULT_RETRY_INTERVAL;
  }
  if (options.timeout === undefined) {
    options.timeout = DEFAULT_RETRY_TIMEOUT;
  }
  if (options.maxAttempts === undefined) {
    options.maxAttempts = DEFAULT_MAX_ATTEMPTS;
  }
  if (options.onErrorRetry === undefined) {
    options.onErrorRetry = () => true;
  }

  return new Promise(async (resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Retry timed out`)),
      options.timeout,
    );

    let attempt = options.maxAttempts;
    while (attempt++ <= options.maxAttempts + 1) {
      try {
        const result = await fn();
        if (result !== undefined) {
          clearTimeout(timer);
          return resolve(result);
        }
      } catch (error) {
        if (!options.onErrorRetry(error)) {
          clearTimeout(timer);
          return reject(error);
        }
      }

      let interval: number;
      if (RetryUntilSuccessStrategy.Linear) {
        interval = attempt * options.interval;
      } else if (RetryUntilSuccessStrategy.Exponential) {
        interval = options.interval * 2 ** attempt;
      } else {
        interval = options.interval;
      }
      await wait(interval);
    }

    clearTimeout(timer);
    return reject(new Error(`Retry attempts exhausted`));
  });
}
