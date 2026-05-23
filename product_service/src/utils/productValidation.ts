import type { ProductJoined } from "../db/productTypes";

export type CreateProductBodyParsed = {
  title: string;
  description?: string;
  price: number;
  count?: number;
};

export function validateCreateProductBody(
  payload: unknown
): { ok: true; value: CreateProductBodyParsed } | { ok: false; message: string } {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return { ok: false, message: "Request body must be a JSON object" };
  }

  const body = payload as Record<string, unknown>;

  if (typeof body.title !== "string" || body.title.trim().length === 0) {
    return { ok: false, message: "title is required and must be non-empty" };
  }

  if (
    body.description !== undefined &&
    body.description !== null &&
    typeof body.description !== "string"
  ) {
    return { ok: false, message: "description must be a string" };
  }

  if (
    typeof body.price !== "number" ||
    !Number.isInteger(body.price) ||
    body.price < 0
  ) {
    return {
      ok: false,
      message: "price is required and must be a non-negative integer",
    };
  }

  if (body.count !== undefined && body.count !== null) {
    if (
      typeof body.count !== "number" ||
      !Number.isInteger(body.count) ||
      body.count < 0
    ) {
      return {
        ok: false,
        message: "count must be a non-negative integer when provided",
      };
    }
  }

  const count =
    body.count === undefined || body.count === null
      ? undefined
      : body.count;

  return {
    ok: true,
    value: {
      title: body.title.trim(),
      description:
        body.description === undefined || body.description === null
          ? undefined
          : String(body.description),
      price: body.price,
      count,
    },
  };
}

export function mapJoinedToPublic(p: ProductJoined): ProductJoined {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    count: p.count,
  };
}
