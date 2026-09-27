import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLogout } from "../hooks/useLogout";
export default function Navbar() {

  const { data: currentUser } = useCurrentUser();
  const logoutMutation = useLogout();
  return (
    <nav>
        <div>
      <h1>Navbar</h1>
      {currentUser ? (
        <div>
        <p>Welcome, {currentUser.name}, {currentUser.role}!</p>
        <button onClick={() => logoutMutation.mutate()}>Log out</button>
        </div>
      ) : (
        <p>Please log in.</p>
      )}
        </div>
    </nav>
  )
}