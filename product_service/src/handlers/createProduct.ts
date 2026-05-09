import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createProductAndStockTxn } from "../db/productWrite";
import { jsonResponse } from "../http/apiGatewayJson";
import { logIncomingRequest } from "./requestLog";
import { mapJoinedToPublic, validateCreateProductBody } from "./productValidation";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logIncomingRequest(event);
  try {
    if (!event.body) {
      return jsonResponse(400, { message: "Request body is required" });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(event.body);
    } catch {
      return jsonResponse(400, { message: "Invalid JSON body" });
    }

    const validation = validateCreateProductBody(parsed);
    if (!validation.ok) {
      return jsonResponse(400, { message: validation.message });
    }

    const created = await createProductAndStockTxn(validation.value);
    return jsonResponse(201, mapJoinedToPublic(created));
  } catch (err) {
    console.error("createProduct failed:", err);
    return jsonResponse(500, { message: "Internal server error" });
  }
}
