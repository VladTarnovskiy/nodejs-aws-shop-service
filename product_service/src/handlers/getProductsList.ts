import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { listProducts } from "../catalog/productCatalog";
import { jsonResponse } from "../http/apiGatewayJson";

export async function handler(
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  return jsonResponse(200, listProducts());
}
