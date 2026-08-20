import { NextResponse } from "next/server";

import { getAdminActor, getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import {
  createRefereeAccount,
  RefereeServiceError,
} from "@/lib/referee-service";
import {
  isRecord,
  readCapabilities,
  readBoolean,
  readDate,
  readEnum,
  readShortText,
  readShortTextArray,
} from "@/lib/referee-validation";
import { refereeQualifications } from "@/lib/referee-qualifications";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  }
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  }
  const actor = getAdminActor(session)!;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("账号内容格式不正确。");
    const referee = await createRefereeAccount({
      publicCode: readShortText(body.publicCode, "裁判员编号", 32),
      name: readShortText(body.name, "姓名", 48),
      studentId: readShortText(body.studentId, "学号", 32, false),
      collegeId: readShortText(body.collegeId, "学院", 64, false),
      grade: readShortText(body.grade, "年级", 32, false),
      phone: readShortText(body.phone, "手机号", 32, false),
      qq: readShortText(body.qq, "QQ", 32, false),
      refereeLevel: readEnum(body.refereeLevel || refereeQualifications[0], refereeQualifications, "裁判资质"),
      joinedAt: readDate(body.joinedAt, "加入日期", false),
      initialPassword: readShortText(body.initialPassword, "初始密码", 256),
      status: readEnum(
        body.status,
        ["PENDING", "ACTIVE", "INACTIVE", "ARCHIVED"] as const,
        "账号状态",
      ),
      elevenASide: readBoolean(body.elevenASide, "十一人制资格"),
      futsal: readBoolean(body.futsal, "五人制资格"),
      certificateNote: readShortText(body.certificateNote, "证书 / 登记编号", 240, false),
      qualificationNote: readShortText(body.qualificationNote, "资质备注", 500, false),
      trainingStatus: readEnum(
        body.trainingStatus,
        ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const,
        "培训状态",
      ),
      publicDirectoryEnabled: readBoolean(body.publicDirectoryEnabled, "公开名录授权"),
      publicBio: readShortText(body.publicBio, "公开简介", 300, false),
      internalNote: readShortText(body.internalNote, "内部备注", 500, false),
      capabilities: body.capabilities === undefined ? undefined : readCapabilities(body.capabilities),
      affiliationUnitIds: body.affiliationUnitIds === undefined ? undefined : readShortTextArray(body.affiliationUnitIds, "组织归属", 64, 30),
    }, actor);
    return NextResponse.json({ ok: true, refereeId: referee.id }, { status: 201 });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "账号创建失败。" },
      { status },
    );
  }
}
