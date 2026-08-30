import { NextResponse } from "next/server";

import { authorizeLegacyAdminRequest } from "@/lib/legacy-admin-authorization";
import { refereeApiErrorResponse, RefereeApiInputError } from "@/lib/referee-api";
import {
  createRefereeAccount,
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
import { refereeGrades } from "@/lib/referee-profile-options";

export async function POST(request: Request) {
  const authorization = await authorizeLegacyAdminRequest(request, "referees:write");
  if (!authorization.ok) return authorization.response;
  const actor = authorization.actor;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new RefereeApiInputError("账号内容格式不正确。");
    const referee = await createRefereeAccount({
      publicCode: readShortText(body.publicCode, "裁判员编号", 32),
      name: readShortText(body.name, "姓名", 48),
      studentId: readShortText(body.studentId, "学号", 32, false),
      collegeId: readShortText(body.collegeId, "学院", 64, false),
      grade: body.grade ? readEnum(body.grade, refereeGrades, "年级") : "",
      phone: readShortText(body.phone, "手机号", 32, false),
      qq: readShortText(body.qq, "QQ", 32, false),
      refereeLevel: readEnum(body.refereeLevel || refereeQualifications[0], refereeQualifications, "裁判资质"),
      joinedAt: readDate(body.joinedAt, "加入日期", false),
      initialPassword: readShortText(body.initialPassword, "初始密码", 256),
      status: readEnum(
        body.status,
        ["PENDING_ACTIVATION", "ACTIVE", "INACTIVE", "ARCHIVED"] as const,
        "账号状态",
      ),
      assignmentEligibility: readEnum(
        body.assignmentEligibility ?? "NOT_ELIGIBLE",
        ["NOT_ELIGIBLE", "ELIGIBLE", "SUSPENDED"] as const,
        "正式选派资格",
      ),
      elevenASide: readBoolean(body.elevenASide, "十一人制资格"),
      futsal: readBoolean(body.futsal, "五人制资格"),
      certificateNote: readShortText(body.certificateNote, "证书 / 登记编号", 240, false),
      qualificationNote: readShortText(body.qualificationNote, "资质备注", 500, false),
      trainingStatus: readEnum(
        body.trainingStatus,
        ["PENDING_ASSESSMENT", "IN_TRAINING", "QUALIFIED"] as const,
        "培训状态",
      ),
      publicDirectoryEnabled: readBoolean(body.publicDirectoryEnabled, "公开名录授权"),
      publicBio: readShortText(body.publicBio, "公开简介", 300, false),
      internalNote: readShortText(body.internalNote, "内部备注", 500, false),
      capabilities: body.capabilities === undefined ? undefined : readCapabilities(body.capabilities),
      affiliationUnitIds: body.affiliationUnitIds === undefined ? undefined : readShortTextArray(body.affiliationUnitIds, "组织归属", 64, 30),
      currentAffiliationUnitId: body.currentAffiliationUnitId === undefined
        ? undefined
        : readShortText(body.currentAffiliationUnitId, "当前组织归属", 64, false),
    }, actor);
    return NextResponse.json({ ok: true, refereeId: referee.id }, { status: 201 });
  } catch (error) {
    return refereeApiErrorResponse(error, "账号创建失败，请稍后重试。");
  }
}
