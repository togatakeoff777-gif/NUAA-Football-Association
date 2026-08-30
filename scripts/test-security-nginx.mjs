import { readFile } from "node:fs/promises";

const candidate = await readFile("ops/nginx/nuaafa-production.disabled.conf.example", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(/client_max_body_size\s+25m\s*;/u.test(candidate), "Candidate body limit is not 25m.");
assert(!/client_max_body_size\s+10m\s*;/u.test(candidate), "Candidate retains the rejected 10m limit.");
assert(
  /proxy_set_header\s+X-Real-IP\s+\$remote_addr\s*;/u.test(candidate),
  "Candidate does not overwrite X-Real-IP with the direct client address.",
);
assert(
  /proxy_set_header\s+X-Forwarded-For\s+\$remote_addr\s*;/u.test(candidate),
  "Candidate does not overwrite X-Forwarded-For.",
);
assert(!candidate.includes("$proxy_add_x_forwarded_for"), "Candidate appends untrusted X-Forwarded-For input.");
assert(candidate.includes("DISABLED CANDIDATE ONLY"), "Candidate lacks a disabled-only warning.");

console.log("F-007/F-009 disabled Nginx candidate static checks passed.");
