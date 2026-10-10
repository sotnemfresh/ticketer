import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useLogout } from "../../hooks/useLogout";
import { UserMenu } from './UserMenu'


export default function Navbar() {


  return (

    <header className="z-20 flex h-14 shrink-0 items-center
                       justify-between border-b bg-background px-4">
      <div className="flex items-center gap-6">

        <h1>Navbar</h1>
      </div>
      <UserMenu />


      {/* Divider 
      <div className="flex items-center gap-2">
          {currentUser ? (
            <div>
              <p>Welcome, {currentUser.name}, {currentUser.role}!</p>
              <Button variant="outline" onClick={() => logoutMutation.mutate()}>Log out</Button>
            </div>
          ) : (
            <p>Please log in.</p>
          )}

      </div>
      */}

    </header>
  )
}