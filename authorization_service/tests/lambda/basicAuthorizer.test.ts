import type { APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { beforeEach, describe, expect, it } from "vitest";
import { handler } from "../../src/lambda/basicAuthorizer";

const METHOD_ARN =
  "arn:aws:execute-api:us-east-1:123456789012:apiId/stage/GET/import";

const TEST_LOGIN = "VladTarnovskiy";
const TEST_PASSWORD = "TEST_PASSWORD";

function basicToken(login: string, password: string): string {
  const encoded = Buffer.from(`${login}:${password}`, "utf-8").toString(
    "base64",
  );
  return `Basic ${encoded}`;
}

function authorizerEvent(
  authorizationToken?: string,
): APIGatewayTokenAuthorizerEvent {
  return {
    type: "TOKEN",
    methodArn: METHOD_ARN,
    authorizationToken: authorizationToken ?? "",
  };
}

describe("basicAuthorizer handler", () => {
  beforeEach(() => {
    process.env[TEST_LOGIN] = TEST_PASSWORD;
    delete process.env["unknown_user"];
  });

  it("returns Allow policy for valid Basic credentials", async () => {
    const result = await handler(
      authorizerEvent(basicToken(TEST_LOGIN, TEST_PASSWORD)),
    );

    expect(result.principalId).toBe(TEST_LOGIN);
    expect(result.policyDocument.Statement[0].Effect).toBe("Allow");
    expect(result.policyDocument.Statement[0].Resource).toBe(METHOD_ARN);
  });

  it("throws Unauthorized when Authorization token is missing", async () => {
    await expect(handler(authorizerEvent())).rejects.toThrow("Unauthorized");
    await expect(handler(authorizerEvent("   "))).rejects.toThrow(
      "Unauthorized",
    );
  });

  it("returns Deny policy (403) for invalid credentials", async () => {
    const result = await handler(
      authorizerEvent(basicToken(TEST_LOGIN, "wrong-password")),
    );

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });

  it("returns Deny policy (403) for unknown user", async () => {
    const result = await handler(
      authorizerEvent(basicToken("unknown_user", TEST_PASSWORD)),
    );

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });

  it("returns Deny policy (403) for malformed Basic token", async () => {
    const result = await handler(authorizerEvent("Bearer some-jwt"));

    expect(result.policyDocument.Statement[0].Effect).toBe("Deny");
  });
});
