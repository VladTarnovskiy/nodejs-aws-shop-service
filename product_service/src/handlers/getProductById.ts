import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { findProductJoinedById } from "../db/productRead";
import { jsonResponse } from "../http/apiGatewayJson";
import { mapJoinedToPublic } from "./productValidation";
import { logIncomingRequest } from "./requestLog";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logIncomingRequest(event);
  try {
    const productId = event.pathParameters?.productId;

    if (!productId) {
      return jsonResponse(400, { message: "Missing productId" });
    }

    const product = await findProductJoinedById(productId);

    if (!product) {
      return jsonResponse(404, { message: "Product not found" });
    }

    return jsonResponse(200, mapJoinedToPublic(product));
  } catch (err) {
    console.error("getProductsById failed:", err);
    return jsonResponse(500, { message: "Internal server error" });
  }
}
