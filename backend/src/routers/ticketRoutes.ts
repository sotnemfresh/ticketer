import { Router, Request, Response } from 'express'
import { createTicket, getAllTickets, getTicketById, getTicketMessages, submitTicketUpdate } from '../services/ticketService.js'
import type { CreateTicketBody, SubmitTicketUpdateBody } from '../types/ticket.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const ticketRouter = Router()
ticketRouter.use(requireAuth)

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

/* Get a ticket by id */
ticketRouter.get('/:ticketId', async (req: Request, res: Response) => {
  try {
    const ticket = await getTicketById(req.params.ticketId)
    return res.status(200).json(ticket)
  } catch (error) {
    const err = error as { status?: number; message?: string }
    return res.status(err.status ?? 500).json({
      message: err.message ?? 'Something went wrong while fetching the ticket',
    })
  }
})

/* Create a new ticket */
ticketRouter.post('/', async (req: Request, res: Response) => {
  try {
    const created = await createTicket(
      req.body as CreateTicketBody,
      req.session.userId!,
    )

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

/* Submit ticket field changes and an optional message together */
ticketRouter.post('/:ticketId/updates', async (req: Request, res: Response) => {
  try {
    const update = await submitTicketUpdate(
      req.params.ticketId,
      req.body as SubmitTicketUpdateBody,
      req.session.userId!,
    )

    return res.status(200).json(update)
  } catch (error) {
    const err = error as { status?: number; message?: string }

    return res.status(err.status ?? 500).json({
      message: err.message ?? 'Something went wrong while submitting the ticket update',
    })
  }
})


