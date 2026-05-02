import type { APIGatewayProxyResult } from "aws-lambda";

export const corsJsonHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export function jsonResponse(
  statusCode: number,
  body: unknown
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsJsonHeaders,
    body: JSON.stringify(body),
  };
}
