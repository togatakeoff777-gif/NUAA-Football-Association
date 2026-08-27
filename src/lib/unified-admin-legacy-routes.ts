const legacyExactRoutes: Record<string, string> = {
  "/referees/admin": "/admin",
  "/referees/admin/": "/admin",
  "/referees/admin/referees": "/admin/referees",
  "/referees/admin/referees/new": "/admin/referees/new",
  "/referees/admin/availability": "/admin/referees/availability",
  "/referees/admin/affiliations": "/admin/organizations",
  "/referees/admin/conflicts": "/admin/conflicts",
  "/referees/admin/statistics": "/admin/statistics",
  "/referees/admin/admins": "/admin/system/admins",
  "/referees/admin/audit-log": "/admin/system/audit",
  "/referees/admin/matches": "/admin/matches",
  "/referees/admin/matches/new": "/admin/matches/new",
  "/referees/admin/matches/competitions": "/admin/competitions",
  "/referees/admin/matches/competitions/new": "/admin/competitions/new",
};

function canonicalSegment(value: string) {
  return encodeURIComponent(decodeURIComponent(value));
}

export function mapLegacyAdminPathToUnified(value: string) {
  const suffixIndex = value.search(/[?#]/);
  const pathname = suffixIndex === -1 ? value : value.slice(0, suffixIndex);
  const suffix = suffixIndex === -1 ? "" : value.slice(suffixIndex);
  const exact = legacyExactRoutes[pathname];
  if (exact) return `${exact}${suffix}`;

  const competitionEdit = pathname.match(/^\/referees\/admin\/matches\/competitions\/([^/]+)\/edit$/);
  if (competitionEdit) return `/admin/competitions/${canonicalSegment(competitionEdit[1])}/edit${suffix}`;

  const matchEdit = pathname.match(/^\/referees\/admin\/matches\/([^/]+)\/edit$/);
  if (matchEdit) return `/admin/matches/${canonicalSegment(matchEdit[1])}/edit${suffix}`;

  const matchDetail = pathname.match(/^\/referees\/admin\/matches\/([^/]+)$/);
  if (matchDetail) return `/admin/matches/${canonicalSegment(matchDetail[1])}${suffix}`;

  const refereeDetail = pathname.match(/^\/referees\/admin\/referees\/([^/]+)$/);
  if (refereeDetail) return `/admin/referees/${canonicalSegment(refereeDetail[1])}${suffix}`;

  return null;
}

export function getSafeUnifiedAdminNext(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.includes("\\") ||
    candidate.startsWith("//") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) return null;

  try {
    const mapped = mapLegacyAdminPathToUnified(candidate) ?? candidate;
    const parsed = new URL(mapped, "https://admin.nuaafa.invalid");
    if (parsed.origin !== "https://admin.nuaafa.invalid" || !parsed.pathname.startsWith("/admin")) {
      return null;
    }
    if (parsed.pathname !== "/admin" && !parsed.pathname.startsWith("/admin/")) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
