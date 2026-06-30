import api from "./axios";
import { ApiResponse, UploadResult } from "@/types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const uploadApi = {
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return api.post<ApiResponse<UploadResult>>("/api/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadWithProgress(
    file: File,
    onProgress: (pct: number) => void,
  ): Promise<ApiResponse<UploadResult>> {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("image", file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid response"));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.addEventListener("abort", () => reject(new Error("Aborted")));

      xhr.open("POST", `${BASE}/api/upload`);

      const token = localStorage.getItem("cs_token");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      if (BASE.includes("ngrok")) xhr.setRequestHeader("ngrok-skip-browser-warning", "true");

      xhr.send(form);
    });
  },
};
