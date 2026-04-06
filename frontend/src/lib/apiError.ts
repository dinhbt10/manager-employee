import axios from "axios";

export function getApiErrorMessage(err: unknown, fallback = "Có lỗi xảy ra") {
  if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
    const d = err.response.data as { error?: string; message?: string };
    if (typeof d.error === "string" && d.error) return d.error;
    if (typeof d.message === "string" && d.message) return d.message;
  }
  return fallback;
}
