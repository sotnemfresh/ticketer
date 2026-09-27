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
    try {
      await loginUser(data.email, data.password);
      console.log('Login successful');
      navigate("/tickets");
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}