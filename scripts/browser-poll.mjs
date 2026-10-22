// Verification only. Await asynchronous browser reads before testing truthiness;
// a browser waitForFunction poller can treat an unresolved Promise as success.
export async function pollAsyncResult(read, { timeoutMs = 15000, intervalMs = 100,
  description = 'an asynchronous browser observation' } = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isFinite(intervalMs) || intervalMs < 0) throw new RangeError('Polling needs a positive timeout and a nonnegative interval.');
  const deadline = Date.now() + timeoutMs;
  const expired = () => new Error(`Timed out after ${timeoutMs} ms waiting for ${description}.`);
  let stopped = false, timer;
  const poll = async () => {
    while (!stopped) {
      const value = await read();
      if (stopped || Date.now() >= deadline) throw expired();
      if (value) return value;
      await new Promise(resolve => setTimeout(resolve, Math.min(intervalMs, deadline - Date.now())));
    }
    throw expired();
  };
  try {
    return await Promise.race([poll(), new Promise((_, reject) => { timer = setTimeout(() => reject(expired()), timeoutMs); })]);
  } finally { stopped = true; clearTimeout(timer); }
}
