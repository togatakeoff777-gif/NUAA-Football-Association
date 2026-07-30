import { NextResponse } from "next/server";

import { getAdminSession, isSameOrigin } from "@/lib/referee-auth";
import {
  RefereeServiceError,
  resetRefereePassword,
  updateRefereeAccount,
} from "@/lib/referee-service";
import {
  isRecord,
  readBoolean,
  readEnum,
  readShortText,
} from "@/lib/referee-validation";

async function authorize(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "请求来源无效。" }, { status: 403 });
  }
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "请先登录管理员后台。" }, { status: 401 });
  }
  return null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("账号内容格式不正确。");
    const { id } = await context.params;
    await updateRefereeAccount(id, {
      publicCode: readShortText(body.publicCode, "裁判员编号", 32),
      name: readShortText(body.name, "姓名", 48),
      status: readEnum(
        body.status,
        ["PENDING", "ACTIVE", "INACTIVE", "ARCHIVED"] as const,
        "账号状态",
      ),
      elevenASide: readBoolean(body.elevenASide, "十一人制资格"),
      futsal: readBoolean(body.futsal, "五人制资格"),
      certificateNote: readShortText(body.certificateNote, "证书或登记说明", 240, false),
      trainingStatus: readEnum(
        body.trainingStatus,
        ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const,
        "培训状态",
      ),
      publicDirectoryEnabled: readBoolean(body.publicDirectoryEnabled, "公开名录授权"),
      publicBio: readShortText(body.publicBio, "公开简介", 300, false),
      internalNote: readShortText(body.internalNote, "内部备注", 500, false),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "账号更新失败。" },
      { status },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    const body: unknown = await request.json();
    if (!isRecord(body)) throw new Error("密码内容格式不正确。");
    const { id } = await context.params;
    await resetRefereePassword(
      id,
      readShortText(body.initialPassword, "新初始密码", 256),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof RefereeServiceError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "密码重置失败。" },
      { status },
    );
  }
}
