import type { Metadata } from "next";
import { ArbitrationPrototype } from "@/components/arbitration/arbitration-prototype";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "仲裁与申诉",
  description: "赛事仲裁、申诉、纪律规则与决定公示的静态页面原型。",
};

export default function ArbitrationPage() {
  return (
    <>
      <SiteHeader />
      <ArbitrationPrototype />
      <SiteFooter />
    </>
  );
}
