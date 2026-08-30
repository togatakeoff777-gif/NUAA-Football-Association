# Disabled Nginx candidate

`nuaafa-production.disabled.conf.example` is a repository recovery/security template only. This R1 does not install, copy, enable, reload, or runtime-test Nginx.

The forwarding contract assumes one public Nginx hop and a loopback-only Next.js service. Nginx overwrites both `X-Real-IP` and `X-Forwarded-For` with `$remote_addr`; the application uses only validated `X-Real-IP` for rate-limit identity.

Cloudflare or any additional proxy hop is not supported by this template. Before such a topology is introduced, define explicit trusted proxy CIDRs and a reviewed address normalization contract instead of appending an untrusted chain.

The 25m body limit leaves framing overhead above the application limits of 20 MiB per PDF and 21 MiB per complete request. A later human-authorized Production Closure must run `nginx -t` and proxy boundary tests before enablement.
