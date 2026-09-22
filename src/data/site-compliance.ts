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
  publicSecurityFiling: {
    number: "鲁公网安备37010302001865号",
    href: "https://beian.mps.gov.cn/#/query/webSearch?code=37010302001865",
    icon: {
      src: "/compliance/beian-police.png",
      alt: "",
    },
  },
};
