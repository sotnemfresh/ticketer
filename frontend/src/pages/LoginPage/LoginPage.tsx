import LoginForm, { type LoginFormInputs } from '../../components/LoginForm'
import { loginUser } from '../../services/loginService'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { Navigate, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  if (user) {
  return <Navigate to="/tickets" replace />;
  }
  const handleLogin = async (data: LoginFormInputs) => {
    await loginUser(data.email, data.password);
    navigate("/tickets");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}