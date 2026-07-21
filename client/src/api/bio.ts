import api from "./axios";

export const bioApi = {
  get: () => api.get("/api/bio"),
  update: (data: any) => api.put("/api/bio", data),
};
