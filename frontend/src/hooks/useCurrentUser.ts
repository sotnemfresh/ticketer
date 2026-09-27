import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../services/authService";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 0,
  });
}