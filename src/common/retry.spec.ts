import { clearTimeout } from 'timers';
import { retryUntilSuccess } from './retry';

describe('retryUntilSuccess', () => {
  it('should work', async () => {
    const fn = () =>
      new Promise((resolve) => setTimeout(() => resolve(true), 10));

    await expect(retryUntilSuccess(fn)).resolves.toBe(true);
  });

  it('should exhaust attempts', async () => {
    const fn = () =>
      new Promise((resolve) => setTimeout(() => resolve(undefined), 10));

    await expect(retryUntilSuccess(fn, { interval: 1 })).rejects.toThrowError(
      'Retry attempts exhausted',
    );
  });

  it('should timeout', async () => {
    let t: NodeJS.Timeout;

    const fn = () =>
      new Promise((resolve) => (t = setTimeout(() => resolve(true), 1000000)));

    await expect(
      retryUntilSuccess(fn, { interval: 10, timeout: 10 }),
    ).rejects.toThrowError('Retry timed out');

    clearTimeout(t);
  });

  it('should ignore errors by default', async () => {
    let counter = 5;

    const fn = () =>
      new Promise((resolve, reject) => {
        counter -= 5;
        if (counter) {
          reject(new Error('not yet'));
        } else {
          resolve(true);
        }
      });

    await expect(retryUntilSuccess(fn, { interval: 1 })).resolves.toBe(true);
  });

  it('should process errors', async () => {
    let counter = 0;
    const fn = () =>
      new Promise((resolve, reject) => {
        counter++;
        reject(new Error('not yet'));
      });

    let i = 0;

    await expect(
      retryUntilSuccess(fn, {
        interval: 1,
        onErrorRetry: () => (i++ === 0 ? true : false),
      }),
    ).rejects.toThrowError('not yet');

    expect(counter).toBe(2);
  });
});
