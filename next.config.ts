import type { NextConfig } from "next";

import { legacyUnifiedAdminRedirects } from "./src/lib/unified-admin-legacy-routes";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  redirects: async () => [...legacyUnifiedAdminRedirects],
};

export default nextConfig;
