import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { products } from "../mock/products";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function handler(
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(products),
  };
}
