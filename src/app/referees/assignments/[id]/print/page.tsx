import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { getPublicAppointmentById } from "@/lib/referee-public";

export const metadata: Metadata = {
  title: "裁判选派单",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function RefereeAppointmentPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appointment = await getPublicAppointmentById(id);
  if (!appointment) notFound();
  return (
    <main className="referee-print-sheet">
      <header>
        <p>南京航空航天大学天目湖足球协会</p>
        <h1>裁判员选派单</h1>
      </header>
      <dl>
        <div><dt>赛事</dt><dd>{appointment.match.competition.name}</dd></div>
        <div><dt>比赛</dt><dd>{appointment.match.homeTeam.name} vs {appointment.match.awayTeam.name}</dd></div>
        <div><dt>轮次</dt><dd>{appointment.match.stage}</dd></div>
        <div><dt>时间</dt><dd>{formatRefereeDateTime(appointment.match.kickoff)}</dd></div>
        <div><dt>场地</dt><dd>{appointment.match.venue}</dd></div>
      </dl>
      <table>
        <thead><tr><th>岗位</th><th>裁判员</th></tr></thead>
        <tbody>
          {appointment.positions.map((position) => (
            <tr key={position.id}>
              <td>{position.label}{position.slot > 1 ? ` ${position.slot}` : ""}</td>
              <td>{position.referee?.name ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {appointment.publicationNote ? <p>{appointment.publicationNote}</p> : null}
      <footer>
        <span>发布时间：{appointment.publishedAt ? formatRefereeDateTime(appointment.publishedAt) : "—"}</span>
        <span>最后更新：{formatRefereeDateTime(appointment.updatedAt)}</span>
      </footer>
    </main>
  );
}
