import { auth } from "@clerk/nextjs/server";

import { apiJson } from "@/lib/api";

export const requireApiUserId = async () => {
  const { userId } = await auth();
  return userId;
};

export const unauthorized = () =>
  apiJson({ success: false, message: "Unauthorized." }, 401);

export const notFound = (message = "Not found.") =>
  apiJson({ success: false, message }, 404);

export const badRequest = (message: string) =>
  apiJson({ success: false, message }, 400);

export const serverError = (message = "Internal server error.") =>
  apiJson({ success: false, message }, 500);

export const serviceUnavailable = (message: string) =>
  apiJson({ success: false, message }, 503);
