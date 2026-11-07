import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function ProtectedRoute() {
  const { data: user, isLoading, isError, error } = useCurrentUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const status = (error as (Error & { status?: number }) | null)?.status;

  if (isError && status !== 401) {
    return <div>Unable to reach the server. Please try again shortly.</div>;
  }

  if (status === 401 || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}