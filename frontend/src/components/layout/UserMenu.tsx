"use client"

import {
    BadgeCheckIcon,
    BellIcon,
    CreditCardIcon,
    LogOutIcon,
} from "lucide-react"
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogout } from "@/hooks/useLogout"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export function UserMenu() {
    const { data: currentUser } = useCurrentUser();
    const logoutMutation = useLogout();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full"><Avatar>
                <AvatarImage src="https://github.com/sotnemfresh.png" alt="sotnemfresh" />
                <AvatarFallback>SF</AvatarFallback>
            </Avatar></Button>} />
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuGroup>

                    <DropdownMenuLabel>
                        <div className="flex items-center gap-3 py-1">
                            <Avatar>
                                <AvatarImage src="https://github.com/sotnemfresh.png" alt="sotnemfresh" />
                                <AvatarFallback>SF</AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-col gap-1">
                                <span className="text-sm font-medium leading-none text-foreground">{currentUser?.name}</span>
                                <span className="text-sm text-muted-foreground leading-none">{currentUser?.email}</span>
                            </div>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        Manage Profile
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    <LogOutIcon />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
