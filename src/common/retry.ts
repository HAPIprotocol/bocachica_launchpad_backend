const DEFAULT_RETRY_INTERVAL = 1000;
const DEFAULT_RETRY_TIMEOUT = 10000;
const DEFAULT_MAX_ATTEMPTS = 10;

export interface RetryUntilSuccessOptions {
  interval?: number;
  timeout?: number;
  maxAttempts?: number;
  onErrorRetry?: (err?: Error) => boolean;
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

    let attempts = options.maxAttempts;
    while (attempts--) {
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

      await wait(options.interval);
    }

    clearTimeout(timer);
    return reject(new Error(`Retry attempts exhausted`));
  });
}
