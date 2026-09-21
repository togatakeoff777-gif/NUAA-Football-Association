export type PublicSecurityFiling = {
  number: string;
  href: string;
  icon: {
    src: string;
    alt: string;
  };
};

type PublicSiteCompliance = {
  icpFiling: {
    number: string;
    href: string;
  };
  publicSecurityFiling: PublicSecurityFiling | null;
};

export const publicSiteCompliance: PublicSiteCompliance = {
  icpFiling: {
    number: "鲁ICP备2026052413号",
    href: "https://beian.miit.gov.cn/",
  },
  publicSecurityFiling: null,
};
