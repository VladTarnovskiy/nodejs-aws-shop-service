export type ProductJoined = {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
};

export type CreateProductInput = {
  title: string;
  description?: string;
  price: number;
  count?: number;
};
