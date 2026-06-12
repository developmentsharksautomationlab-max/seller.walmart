import { z } from "zod";

export const ORDER_STATUSES = [
  "Unshipped",
  "Shipped",
  "Delivered",
  "Canceled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const ProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  category: z.string().trim().min(1, "Category is required."),
  price: z.coerce.number().positive("Price must be greater than 0."),
  stock: z.coerce
    .number()
    .int("Stock must be a whole number.")
    .min(0, "Stock cannot be negative."),
});

export const OrderSchema = z.object({
  productId: z.string().min(1, "Please choose a product."),
  customerName: z.string().trim().min(1, "Customer name is required."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .positive("Quantity must be at least 1."),
  status: z.enum(ORDER_STATUSES),
});

// One normalized row from an uploaded spreadsheet, ready to import. The client
// maps arbitrary column headers into this shape; the server re-validates it.
export const ImportRowSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  productName: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  amount: z.number().nonnegative(),
  status: z.enum(ORDER_STATUSES),
  date: z.string().nullable(), // ISO string or null (defaults to now on import)
});
export type ImportRow = z.infer<typeof ImportRowSchema>;

// Shape returned by auth/data Server Actions, consumed by useActionState.
export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      success?: boolean;
    }
  | undefined;

/**
 * Maps a ZodError into a { field: [messages] } record. Reads `.issues`
 * directly so it works across zod 3 and 4 (where `.flatten()` is deprecated).
 */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
