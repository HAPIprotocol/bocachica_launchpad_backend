export function flobj(object: Record<string, string | number | boolean>) {
  const keyvals: string[] = [];
  for (const key of Object.keys(object).sort()) {
    if (typeof object[key] === 'object' || typeof object[key] === 'function') {
      continue;
    }
    keyvals.push(key + '=' + JSON.stringify(object[key]));
  }
  return keyvals.join(' ');
}
