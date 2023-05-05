export function extractError(error: any): string | undefined {
  if (!error) {
    return undefined;
  } else if (typeof error === "object" && typeof error?.message === "string") {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else {
    return "An unknown error ocurred.";
  }
}
