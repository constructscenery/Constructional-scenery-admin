import api from "./axios";
import { ApiResponse, World, WorldInput } from "@/types";

export const worldsApi = {
  list: () => api.get<ApiResponse<World[]>>("/api/worlds"),
  getBySlug: (slug: string) => api.get<ApiResponse<World>>(`/api/worlds/${slug}`),
  getById: (id: number) => api.get<ApiResponse<World>>(`/api/worlds/${id}`),
  create: (data: WorldInput) => api.post<ApiResponse<World>>("/api/worlds", data),
  update: (id: number, data: WorldInput) => api.put<ApiResponse<World>>(`/api/worlds/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<null>>(`/api/worlds/${id}`),
};
