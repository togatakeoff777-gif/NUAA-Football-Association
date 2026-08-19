import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/referee-security";

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const username = process.env.V29_ADMIN_USERNAME?.trim().toLowerCase() ?? "";
  const displayName = process.env.V29_ADMIN_DISPLAY_NAME?.trim() || username;
  const password = process.env.V29_ADMIN_PASSWORD ?? "";
  const confirmation = process.env.V29_CONFIRM_LOCAL_ADMIN_BOOTSTRAP;

  if (!databaseUrl.startsWith("file:")) {
    throw new Error("管理员初始化仅允许显式指定本地 file: SQLite 数据库。");
  }
  if (confirmation !== "YES_LOCAL_ONLY") {
    throw new Error("请设置 V29_CONFIRM_LOCAL_ADMIN_BOOTSTRAP=YES_LOCAL_ONLY 后再执行。");
  }
  if (!username || username.length > 64) throw new Error("管理员账号格式不正确。");
  if (!password) throw new Error("必须通过 V29_ADMIN_PASSWORD 提供密码，不得使用代码默认值。");

  const passwordHash = await hashPassword(password);
  const account = await prisma.adminAccount.upsert({
    where: { username },
    update: {
      displayName,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      username,
      displayName,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      mustChangePassword: false,
    },
    select: { id: true, username: true, role: true },
  });
  console.log(JSON.stringify({ createdOrUpdated: true, ...account }, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : "管理员初始化失败。");
    await prisma.$disconnect();
    process.exit(1);
  });
