import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const password = process.env.PASSWORD_TO_HASH;

if (!password || password.length < 12 || password.length > 256) {
  console.error("Set PASSWORD_TO_HASH to a 12–256 character password for this one command.");
  process.exit(1);
}

const salt = randomBytes(16);
const derived = await scrypt(password, salt, 64);
console.log(`scrypt$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`);
