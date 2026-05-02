import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { findProductById } from "../catalog/productCatalog";
import { jsonResponse } from "../http/apiGatewayJson";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const productId = event.pathParameters?.productId;

  if (!productId) {
    return jsonResponse(400, { message: "Missing productId" });
  }

  const product = findProductById(productId);

  if (!product) {
    return jsonResponse(404, { message: "Product not found" });
  }

  return jsonResponse(200, product);
}
