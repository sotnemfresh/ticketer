import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: ["currentUser"],
      });
      navigate("/login");
    },
  });
}