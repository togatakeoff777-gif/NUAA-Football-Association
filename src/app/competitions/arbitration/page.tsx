import type { Metadata } from "next";
import { ArbitrationPrototype } from "@/components/arbitration/arbitration-prototype";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/arbitration" },
  title: "仲裁与申诉",
  description: "赛事仲裁、申诉范围、材料流程、纪律决定与真实文件入口。",
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
