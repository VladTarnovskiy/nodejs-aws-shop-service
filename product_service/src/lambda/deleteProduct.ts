import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { findProductJoinedById } from "../db/productRead";
import { deleteProductAndStockTxn } from "../db/productWrite";
import { jsonResponse } from "../http/apiGatewayJson";
import { logIncomingRequest } from "../utils/requestLog";
import { mapJoinedToPublic } from "../utils/productValidation";

export async function handler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  logIncomingRequest(event);
  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return jsonResponse(400, { message: "Missing productId" });
    }

    const existing = await findProductJoinedById(productId);
    if (!existing) {
      return jsonResponse(404, { message: "Product not found" });
    }

    await deleteProductAndStockTxn(productId);
    return jsonResponse(200, mapJoinedToPublic(existing));
  } catch (err) {
    console.error("deleteProduct failed:", err);
    return jsonResponse(500, { message: "Internal server error" });
  }
}
