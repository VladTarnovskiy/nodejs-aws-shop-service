import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

export function resolveAuthorizerCredentials(): Record<string, string> {
  const envPath = path.join(__dirname, "..", ".env");

  if (!fs.existsSync(envPath)) {
    throw new Error(
      "Create authorization_service/.env with your GitHub login and password, e.g. VladTarnovskiy=TEST_PASSWORD",
    );
  }

  const parsed = dotenv.parse(fs.readFileSync(envPath));
  const entries = Object.entries(parsed).filter(
    ([, value]) => typeof value === "string" && value.length > 0,
  );

  if (entries.length === 0) {
    throw new Error(
      "authorization_service/.env must define at least one credential as {github_login}=TEST_PASSWORD",
    );
  }

  return Object.fromEntries(entries);
}
