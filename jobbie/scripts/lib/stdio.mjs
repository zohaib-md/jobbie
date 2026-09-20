export async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    throw new Error('Expected JSON on stdin');
  }
  return JSON.parse(raw);
}

export function writeJson(data) {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

export function fail(message) {
  const error = new Error(message);
  error.exitCode = 1;
  throw error;
}
