import api from "./axios";
import { ApiResponse, World, WorldInput } from "@/types";

export const worldsApi = {
  list: () => api.get<ApiResponse<World[]>>("/api/worlds"),
  getBySlug: (slug: string) => api.get<ApiResponse<World>>(`/api/worlds/${slug}`),
  create: (data: WorldInput) => api.post<ApiResponse<World>>("/api/worlds", data),
  update: (slug: string, data: WorldInput) => api.put<ApiResponse<World>>(`/api/worlds/${slug}`, data),
  delete: (slug: string) => api.delete<ApiResponse<null>>(`/api/worlds/${slug}`),
};
