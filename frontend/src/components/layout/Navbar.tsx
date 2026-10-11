import { UserMenu } from './UserMenu'
import { ModeToggle } from './mode-toggle'


export default function Navbar() {
  return (
    <header className="z-20 flex h-14 shrink-0 items-center
                       justify-between border-b bg-background px-4">
      <div className="flex items-center gap-6">
        <h1>Navbar</h1>
        <ModeToggle />
      </div>
      <UserMenu />
    </header>
  )
}