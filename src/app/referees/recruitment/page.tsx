import type { Metadata } from "next";

import { RefereeRecruitment } from "@/components/referees/referee-recruitment";

export const metadata: Metadata = { title: "裁判员招募", description: "南航天目湖足协裁判员公开招募流程原型。" };

export default function RefereeRecruitmentPage() { return <RefereeRecruitment />; }
