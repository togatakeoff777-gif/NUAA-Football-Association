import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/referee-auth";
import { prisma } from "@/lib/prisma";
import { formatRefereeDateTime } from "@/lib/referee-presenters";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function csvResponse(filename: string, rows: unknown[][]) {
  const body = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  }
  const { kind } = await context.params;
  const url = new URL(request.url);

  if (kind === "referees") {
    const referees = await prisma.referee.findMany({ orderBy: { publicCode: "asc" } });
    return csvResponse("referees.csv", [
      ["裁判员编号", "姓名", "账号状态", "十一人制", "五人制", "培训状态", "公开名录授权"],
      ...referees.map((item) => [
        item.publicCode,
        item.name,
        item.status,
        item.elevenASide ? "是" : "否",
        item.futsal ? "是" : "否",
        item.trainingStatus,
        item.publicDirectoryEnabled ? "是" : "否",
      ]),
    ]);
  }

  const matchId = url.searchParams.get("matchId");
  if (!matchId) {
    return NextResponse.json({ error: "请指定比赛。" }, { status: 400 });
  }
  if (kind === "applications") {
    const applications = await prisma.refereeApplication.findMany({
      where: { matchId },
      include: { referee: true },
      orderBy: { createdAt: "asc" },
    });
    return csvResponse("match-applications.csv", [
      ["裁判员编号", "姓名", "报名状态", "意向岗位", "说明", "提交时间"],
      ...applications.map((item) => [
        item.referee.publicCode,
        item.referee.name,
        item.status,
        item.preferredPositions,
        item.note,
        formatRefereeDateTime(item.createdAt),
      ]),
    ]);
  }
  if (kind === "appointments") {
    const appointment = await prisma.refereeAppointment.findUnique({
      where: { matchId },
      include: {
        match: { include: { competition: true, homeTeam: true, awayTeam: true } },
        positions: {
          include: { referee: true },
          orderBy: [{ sortOrder: "asc" }, { slot: "asc" }],
        },
      },
    });
    if (!appointment) {
      return NextResponse.json({ error: "选派记录不存在。" }, { status: 404 });
    }
    return csvResponse("match-appointment.csv", [
      ["赛事", "比赛", "岗位", "岗位序号", "裁判员编号", "姓名", "状态"],
      ...appointment.positions.map((position) => [
        appointment.match.competition.name,
        `${appointment.match.homeTeam.name} vs ${appointment.match.awayTeam.name}`,
        position.label,
        position.slot,
        position.referee?.publicCode,
        position.referee?.name,
        appointment.status,
      ]),
    ]);
  }
  return NextResponse.json({ error: "导出类型不存在。" }, { status: 404 });
}
