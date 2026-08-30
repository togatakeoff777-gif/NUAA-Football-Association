import { refereeApiErrorResponse, RefereeApiInputError } from "../src/lib/referee-api";
import { RefereeServiceError } from "../src/lib/referee-service-error";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const typedInput = refereeApiErrorResponse(new RefereeApiInputError("字段格式不正确。"), "fallback");
  assert(typedInput.status === 400, "Typed input error did not retain status 400.");
  assert((await typedInput.json() as { error?: string }).error === "字段格式不正确。", "Typed input message was not retained.");

  const typedConflict = refereeApiErrorResponse(new RefereeServiceError("状态冲突。", 409), "fallback");
  assert(typedConflict.status === 409, "Typed domain error did not retain status 409.");
  assert((await typedConflict.json() as { error?: string }).error === "状态冲突。", "Typed domain message was not retained.");

  const originalConsoleError = console.error;
  const logs: string[] = [];
  console.error = (...values: unknown[]) => { logs.push(JSON.stringify(values)); };
  try {
    const unexpected = [
      Object.assign(new Error("Prisma query failed: no such table Referee; password=SECRET"), { name: "PrismaClientKnownRequestError" }),
      Object.assign(new Error("SQLITE_ERROR near SELECT * FROM AdminSession"), { name: "LibsqlError" }),
      Object.assign(new Error("ENOENT C:\\private\\uploads\\secret.pdf"), { name: "Error" }),
      Object.assign(new Error("Cannot read properties of undefined (reading token)"), { name: "TypeError" }),
      Object.assign(new Error("secret in forged name"), { name: "password=SECRET" }),
    ];
    for (const error of unexpected) {
      const response = refereeApiErrorResponse(error, "固定安全错误。");
      const serialized = JSON.stringify(await response.json());
      assert(response.status === 500, `${error.name} did not return 500.`);
      assert(serialized.includes("固定安全错误") && serialized.includes("INTERNAL_ERROR"), `${error.name} did not return the fixed safe contract.`);
      for (const forbidden of ["Prisma", "SQLITE", "SELECT", "AdminSession", "Referee", "private", "secret.pdf", "password", "SECRET", "undefined", "token"]) {
        assert(!serialized.includes(forbidden), `${error.name} leaked ${forbidden} to the client.`);
      }
    }
  } finally {
    console.error = originalConsoleError;
  }

  const serializedLogs = logs.join("\n");
  for (const forbidden of ["no such table", "SELECT", "C:\\private", "secret.pdf", "password=", "SECRET", "reading token"]) {
    assert(!serializedLogs.includes(forbidden), `Sanitized server log leaked ${forbidden}.`);
  }
  assert(logs.length === 5, "Unexpected errors did not emit one sanitized correlation log each.");

  console.log("F-004 typed and unexpected API error mapping tests passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
