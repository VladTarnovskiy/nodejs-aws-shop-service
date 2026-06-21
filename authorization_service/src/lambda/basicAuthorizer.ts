import type {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerHandler,
} from "aws-lambda";

const BASIC_PREFIX = "Basic ";

function generatePolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}

function decodeBasicCredentials(
  authorizationToken: string,
): { username: string; password: string } | null {
  if (!authorizationToken.startsWith(BASIC_PREFIX)) {
    return null;
  }

  const encoded = authorizationToken.slice(BASIC_PREFIX.length).trim();
  if (!encoded) {
    return null;
  }

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf-8");
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

export const handler: APIGatewayTokenAuthorizerHandler = async (event) => {
  const authorizationToken = event.authorizationToken?.trim();

  if (!authorizationToken) {
    throw new Error("Unauthorized");
  }

  const credentials = decodeBasicCredentials(authorizationToken);
  if (!credentials) {
    return generatePolicy("anonymous", "Deny", event.methodArn);
  }

  const { username, password } = credentials;
  const expectedPassword = process.env[username];

  if (!expectedPassword || expectedPassword !== password) {
    return generatePolicy(username, "Deny", event.methodArn);
  }

  return generatePolicy(username, "Allow", event.methodArn);
};
