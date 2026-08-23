import { prisma } from "@/lib/prisma";
import { RefereeServiceError } from "@/lib/referee-service-error";
import { isRecord, readShortText } from "@/lib/referee-validation";

export async function submitRefereeAdmissionApplication(input: unknown) {
  if (!isRecord(input)) {
    throw new RefereeServiceError("提交内容格式不正确。");
  }

  const name = readShortText(input.name, "姓名", 48);
  const studentId = readShortText(input.studentId, "学号", 32, false);
  const phone = readShortText(input.phone, "手机号", 32, false);
  const qq = readShortText(input.qq, "QQ", 32, false);
  const note = readShortText(input.note, "补充说明", 240, false);

  if (!phone && !qq) {
    throw new RefereeServiceError("请至少填写手机号或 QQ。");
  }

  return prisma.refereeAdmissionApplication.create({
    data: {
      name,
      studentId: studentId || null,
      phone: phone || null,
      qq: qq || null,
      note: note || null,
      status: "PENDING",
    },
    select: {
      id: true,
      status: true,
    },
  });
}
