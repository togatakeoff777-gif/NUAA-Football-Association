const origin = process.env.HEALTHCHECK_ORIGIN ?? "http://127.0.0.1:3000";
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10_000);

try {
  const response = await fetch(new URL("/api/health", origin), {
    redirect: "error",
    signal: controller.signal,
  });
  const payload = await response.json();
  if (!response.ok || payload?.status !== "ok") {
    throw new Error(`Health check returned HTTP ${response.status}.`);
  }
  console.log(`${origin}/api/health: ok`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Health check failed.");
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
