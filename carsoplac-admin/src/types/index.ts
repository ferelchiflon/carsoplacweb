export type Product = {
  id: number;
  name: string;
  price: number;
  description: string;
  brand: string;
  stock?: number;
  images: string[];
};
export type Category = {
  id: number;
  name: string;
};
