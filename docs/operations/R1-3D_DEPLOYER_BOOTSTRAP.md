# R1-3D reviewed production deployer bootstrap

Status: procedure prepared by PREFLIGHT FIX-3B; **not executed and not
authorized**. Run it only during a separately approved Phase B online
preparation step, before stage-only. It changes the deployer executable but must
not change the application release, database, environment, content, service, or
timers.

## Frozen hash contract

```text
Expected installed Fix-3A SHA-256:
a3de22095a9d894c3ae2bc412c07432263dd0822f24d4bea28d2acadb545d694

Reviewed Fix-3B canonical-source SHA-256:
a5267ba836d54e6857c9fcac317a4ac21f9dc7635ea3e72b5f09dfd105f712c5
```

The application SHA and source checkout below must be filled from the final
reviewed/pushed Fix-3B handoff. The checkout is a root-controlled, clean,
detached checkout of that exact commit, obtained by the separately approved
source-transfer procedure. Do not copy from the running release or an
unreviewed working tree.

## Preflight and candidate preparation

Run in a root shell with `set -euo pipefail`. Do not enable command tracing and
do not print environment-file contents or credentials.

```bash
sudo -i
set -euo pipefail
umask 077

reviewed_app_sha='<APPROVED_FIX_3B_40_HEX_SHA>'
reviewed_ref='refs/heads/feat/v2.9-unified-admin-r1'
reviewed_checkout='/ABSOLUTE/ROOT-CONTROLLED/REVIEWED-CHECKOUT'
reviewed_source="$reviewed_checkout/ops/deploy/nuaafa-deploy"
target=/usr/local/sbin/nuaafa-deploy
expected_old_sha=a3de22095a9d894c3ae2bc412c07432263dd0822f24d4bea28d2acadb545d694
expected_new_sha=a5267ba836d54e6857c9fcac317a4ac21f9dc7635ea3e72b5f09dfd105f712c5
operation_id="fix3b-$(date -u +%Y%m%dT%H%M%SZ)"
candidate="/usr/local/sbin/.nuaafa-deploy.$operation_id.new"
recovery_candidate="/usr/local/sbin/.nuaafa-deploy.$operation_id.recovery"
failed_candidate="/usr/local/sbin/.nuaafa-deploy.$operation_id.failed"
quarantine_root=/var/lib/nuaafa/deployer-quarantine
old_backup="$quarantine_root/nuaafa-deploy.$operation_id.fix3a"

printf '%s\n' "$reviewed_app_sha" | grep -Eq '^[0-9a-f]{40}$'
printf '%s\n' "$reviewed_ref" | grep -Eq '^refs/heads/[A-Za-z0-9][A-Za-z0-9._/-]*$'
test -d "$reviewed_checkout"
test ! -L "$reviewed_checkout"
test "$(git -C "$reviewed_checkout" rev-parse HEAD)" = "$reviewed_app_sha"
test -z "$(git -C "$reviewed_checkout" status --porcelain)"
test "$(git -C "$reviewed_checkout" ls-tree HEAD ops/deploy/nuaafa-deploy | awk '{print $1}')" = 100755
test -f "$reviewed_source"
test ! -L "$reviewed_source"
test "$(sha256sum "$reviewed_source" | awk '{print $1}')" = "$expected_new_sha"
bash -n "$reviewed_source"

test -f "$target"
test ! -L "$target"
test "$(stat -c '%U:%G' "$target")" = root:root
test "$(stat -c '%a' "$target")" = 755
test "$(sha256sum "$target" | awk '{print $1}')" = "$expected_old_sha"
bash -n "$target"

for path in "$candidate" "$recovery_candidate" "$failed_candidate" "$old_backup"; do
  test ! -e "$path"
  test ! -L "$path"
done

if test -e "$quarantine_root"; then
  test -d "$quarantine_root"
  test ! -L "$quarantine_root"
  test "$(readlink -f "$quarantine_root")" = "$quarantine_root"
else
  install -d -o root -g root -m 0700 "$quarantine_root"
fi

install -o root -g root -m 0700 -- "$target" "$old_backup"
test "$(sha256sum "$old_backup" | awk '{print $1}')" = "$expected_old_sha"

install -o root -g root -m 0755 -- "$reviewed_source" "$candidate"
test -f "$candidate"
test ! -L "$candidate"
test "$(stat -c '%U:%G' "$candidate")" = root:root
test "$(stat -c '%a' "$candidate")" = 755
test "$(sha256sum "$candidate" | awk '{print $1}')" = "$expected_new_sha"
bash -n "$candidate"
```

The candidate is deliberately in `/usr/local/sbin`, so `mv -T` publishes it on
the same filesystem. The old executable is quarantined before replacement and
is never overwritten.

## Atomic replacement, validation, and automatic bootstrap rollback

```bash
mv -T -- "$candidate" "$target"

bootstrap_ok=1
test -f "$target" || bootstrap_ok=0
test ! -L "$target" || bootstrap_ok=0
test "$(stat -c '%U:%G' "$target")" = root:root || bootstrap_ok=0
test "$(stat -c '%a' "$target")" = 755 || bootstrap_ok=0
test "$(sha256sum "$target" | awk '{print $1}')" = "$expected_new_sha" || bootstrap_ok=0
bash -n "$target" || bootstrap_ok=0
test "$("$target" --version)" = 'nuaafa-deploy R1-3D-FIX-3B-1' || bootstrap_ok=0

# This may create/update deployment-lock metadata; it must not mutate deployment state.
"$target" --dry-run --stage-only --allowed-ref "$reviewed_ref" "$reviewed_app_sha" \
  || bootstrap_ok=0

if test "$bootstrap_ok" != 1; then
  test -f "$target"
  test ! -L "$target"
  mv -T -- "$target" "$failed_candidate"
  install -o root -g root -m 0755 -- "$old_backup" "$recovery_candidate"
  test "$(sha256sum "$recovery_candidate" | awk '{print $1}')" = "$expected_old_sha"
  bash -n "$recovery_candidate"
  mv -T -- "$recovery_candidate" "$target"
  test "$(stat -c '%U:%G %a' "$target")" = 'root:root 755'
  test "$(sha256sum "$target" | awk '{print $1}')" = "$expected_old_sha"
  echo 'STOP: Fix-3B deployer bootstrap validation failed; Fix-3A deployer restored.' >&2
  exit 1
fi

printf 'installed_deployer_sha=%s\n' "$(sha256sum "$target" | awk '{print $1}')"
printf 'installed_deployer_version=%s\n' "$("$target" --version)"
printf 'quarantined_old_deployer=%s\n' "$old_backup"
```

The dry-run output must say it would fetch/checkout/build and would not migrate,
switch current, or control the service. Stop if it reports otherwise. Keep the
root-only prior and failed candidates for incident review; cleanup requires a
separate explicit decision.

Successful bootstrap does not stage or activate the application. The next
separately approved online command is the exact-SHA `--stage-only` operation in
the controlled runbook. Do not run full deploy as a substitute.
