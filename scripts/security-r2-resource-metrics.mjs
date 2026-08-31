import { appendFileSync } from "node:fs";

const target = process.env.SECURITY_R2_RESOURCE_METRICS_PATH;
if (target) {
  const rssCeiling = 512 * 1024 * 1024;
  const startedCpu = process.cpuUsage();
  let stopping = false;
  function sample(type = "sample") {
    if (stopping) return;
    const memory = process.memoryUsage();
    const cpu = process.cpuUsage(startedCpu);
    appendFileSync(target, `${JSON.stringify({
      type,
      timestampMs: Date.now(),
      pid: process.pid,
      rss: memory.rss,
      heapUsed: memory.heapUsed,
      external: memory.external,
      arrayBuffers: memory.arrayBuffers,
      cpuMicros: cpu.user + cpu.system,
    })}\n`);
    if (memory.rss > rssCeiling) {
      stopping = true;
      appendFileSync(target, `${JSON.stringify({ type: "safety-stop", timestampMs: Date.now(), pid: process.pid, rss: memory.rss })}\n`);
      process.exit(70);
    }
  }
  sample("start");
  const timer = setInterval(sample, 10);
  timer.unref();
  process.once("exit", () => sample("exit"));
}
