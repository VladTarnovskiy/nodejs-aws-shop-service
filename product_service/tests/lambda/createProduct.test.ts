import type { APIGatewayProxyEvent } from "aws-lambda";
import { describe, expect, it } from "vitest";
import * as productWrite from "../../src/db/productWrite";
import { handler } from "../../src/lambda/createProduct";

function eventWithBody(body: string | undefined): APIGatewayProxyEvent {
  return {
    httpMethod: "POST",
    path: "/products",
    body,
  } as APIGatewayProxyEvent;
}

describe("createProduct handler", () => {
  it("returns 400 when body is missing", async () => {
    const res = await handler(eventWithBody(undefined));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      message: "Request body is required",
    });
    expect(productWrite.createProductAndStockTxn).not.toHaveBeenCalled();
  });

  it("returns 400 when JSON is invalid", async () => {
    const res = await handler(eventWithBody("{"));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ message: "Invalid JSON body" });
    expect(productWrite.createProductAndStockTxn).not.toHaveBeenCalled();
  });

  it("returns 400 when validation fails", async () => {
    const res = await handler(
      eventWithBody(JSON.stringify({ title: "", price: 1 }))
    );

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toMatchObject({ message: expect.any(String) });
    expect(productWrite.createProductAndStockTxn).not.toHaveBeenCalled();
  });

  it("returns 201 and created product on success", async () => {
    const res = await handler(
      eventWithBody(
        JSON.stringify({
          title: "New",
          description: "Desc",
          price: 42,
          count: 3,
        })
      )
    );

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toEqual({
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      title: "New",
      description: "Desc",
      price: 42,
      count: 3,
    });
    expect(productWrite.createProductAndStockTxn).toHaveBeenCalledWith({
      title: "New",
      description: "Desc",
      price: 42,
      count: 3,
    });
  });
});
