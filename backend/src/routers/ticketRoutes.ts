import { Router, Request, Response } from 'express'
import { createTicket, createTicketMessage, getAllTickets, getTicketMessages } from '../services/ticketService.js'
import type { CreateTicketBody } from '../types/ticket.js'

export const ticketRouter = Router()

/* --Ticket handling-- */
/* Get all tickets */
ticketRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tickets = await getAllTickets()
    return res.status(200).json(tickets)
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong while fetching tickets' })
  }
})

/* Create a new ticket */
ticketRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateTicketBody
    const created = await createTicket(body)
    return res.status(201).json(created)
  } catch (error) {
    const err = error as { status?: number; message?: string }
    return res.status(err.status ?? 500).json({
      message: err.message ?? 'Something went wrong while creating the ticket',
    })
  }
})

/* --Ticket message handling-- */
/* Get the ticket messages */
ticketRouter.get('/:ticketId/messages', async (req, res) => {
  try {
    const messages = await getTicketMessages(req.params.ticketId)
    return res.status(200).json(messages)
  } catch (error) {
    const err = error as { status?: number; message?: string }
    return res.status(err.status ?? 500).json({
      message: err.message ?? 'Something went wrong while fetching ticket messages',
    })
  }
})

/* Create a new message for a ticket */
ticketRouter.post('/:ticketId/messages', async (req: Request, res: Response) => {
  try {
    const message = await createTicketMessage(req.params.ticketId, req.body)
    return res.status(201).json(message)
  } catch (error) {
    const err = error as { status?: number; message?: string }
    return res.status(err.status ?? 500).json({
      message: err.message ?? 'Something went wrong while creating the ticket message',
    })
  }
})


