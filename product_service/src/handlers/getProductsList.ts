import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { listProductsJoined } from "../db/productRead";
import { jsonResponse } from "../http/apiGatewayJson";
import { logIncomingRequest } from "./requestLog";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  logIncomingRequest(event);
  try {
    const products = await listProductsJoined();
    return jsonResponse(200, products);
  } catch (err) {
    console.error("getProductsList failed:", err);
    return jsonResponse(500, { message: "Internal server error" });
  }
}
