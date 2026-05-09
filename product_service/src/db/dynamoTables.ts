export function requireTableNames(): { products: string; stocks: string } {
  const products = process.env.PRODUCTS_TABLE_NAME;
  const stocks = process.env.STOCKS_TABLE_NAME;
  if (!products || !stocks) {
    throw new Error("PRODUCTS_TABLE_NAME and STOCKS_TABLE_NAME must be set");
  }
  return { products, stocks };
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
