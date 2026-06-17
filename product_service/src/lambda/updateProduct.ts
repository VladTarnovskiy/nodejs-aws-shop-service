import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { findProductJoinedById } from "../db/productRead";
import { updateProductAndStockTxn } from "../db/productWrite";
import { jsonResponse } from "../http/apiGatewayJson";
import { logIncomingRequest } from "../utils/requestLog";
import {
  mapJoinedToPublic,
  validateCreateProductBody,
} from "../utils/productValidation";

export async function handler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  logIncomingRequest(event);
  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return jsonResponse(400, { message: "Missing productId" });
    }

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

    const existing = await findProductJoinedById(productId);
    if (!existing) {
      return jsonResponse(404, { message: "Product not found" });
    }

    const updated = await updateProductAndStockTxn(
      productId,
      validation.value,
    );
    return jsonResponse(200, mapJoinedToPublic(updated));
  } catch (err) {
    console.error("updateProduct failed:", err);
    return jsonResponse(500, { message: "Internal server error" });
  }
}
