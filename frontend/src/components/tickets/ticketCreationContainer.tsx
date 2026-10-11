import { useState } from "react"
import { toast } from "@/components/ui/toast"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useCreateTicket } from "@/services/ticketService"
import { useUsers } from "@/services/userService"
import { TicketCreation } from "./ticketCreation"

export function TicketCreationContainer() {
  const [open, setOpen] = useState(false)
  const usersQuery = useUsers(open)
  const { data: currentUser } = useCurrentUser()
  const createTicket = useCreateTicket()

  async function handleCreate(data: Parameters<typeof createTicket.mutateAsync>[0]) {
    await toast.promise(createTicket.mutateAsync(data), {
      loading: { title: "Creating ticket...", type: "loading" },
      success: { title: "Ticket created", description: "The new ticket is ready.", type: "success" },
      error: (error) => ({
        title: "Could not create ticket",
        description: error instanceof Error ? error.message : "The ticket could not be created.",
        type: "error",
      }),
    })
  }

  return (
    <TicketCreation
      open={open}
      onOpenChange={setOpen}
      users={usersQuery.data ?? []}
      currentUserId={currentUser?.id}
      isLoadingUsers={usersQuery.isLoading}
      usersError={usersQuery.isError}
      onRetryUsers={() => { void usersQuery.refetch() }}
      isCreating={createTicket.isPending}
      onCreate={handleCreate}
    />
  )
}