import type { APIGatewayProxyEvent } from "aws-lambda";

export function logIncomingRequest(event: APIGatewayProxyEvent): void {
  console.log("Incoming request:", {
    httpMethod: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    body: event.body,
    rawHeaders: event.headers,
  });
}
