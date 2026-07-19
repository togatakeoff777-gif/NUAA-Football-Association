import type { Metadata } from "next";

import { RefereeRecruitment } from "@/components/referees/referee-recruitment";

export const metadata: Metadata = { title: "裁判员注册指南", description: "天目湖足协裁判员加入与公开招募流程原型。" };

export default function RefereeGuidePage() { return <RefereeRecruitment />; }
