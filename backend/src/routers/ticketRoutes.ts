import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { statusMap, priorityMap, type CreateTicketBody } from '../types/ticket.js'
import { parseTicketId } from '../helpers/ticketId.js'


export const ticketRouter = Router();


/* --Ticket handling-- */
/* Get all tickets */
ticketRouter.get('/', async (req: Request, res: Response) => {
  const tickets = await prisma.ticket.findMany();
  res.json(tickets);
});

/* Create a new ticket */
ticketRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body as CreateTicketBody

  const { subject, description, status, priority } = body

  if (!subject || !description || !status || !priority) {
    return res.status(400).json({
      message: 'subject, description, status, and priority are required',
    })
  }

  const mappedStatus = statusMap[status]
  const mappedPriority = priorityMap[priority]

  if (!mappedStatus || !mappedPriority) {
    return res.status(400).json({
      message: 'Invalid status or priority value',
    })
  }

  try {
    const created = await prisma.ticket.create({
      data: {
        subject,
        description,
        status: mappedStatus,
        priority: mappedPriority,
      },
    })

    return res.status(201).json(created)
  } catch (error) {
    return res.status(500).json({
      message: 'Something went wrong while creating the ticket',
    })
  }
});


/* --Ticket message handling-- */
/* Get the ticket messages */
ticketRouter.get('/:ticketId/messages', async (req, res) => {
  const result = await parseTicketId(req.params.ticketId)

  if ('error' in result) {
    return res.status(
      result.error === 'Ticket not found' ? 404 : 400
    ).json({ message: result.error })
  }

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: result.ticketId },
    orderBy: { createdAt: 'asc' },
  })

  return res.status(200).json(messages)
})


/* Create a new message for a ticket */
ticketRouter.post('/:ticketId/messages', async (req: Request, res: Response) => {
  const result = await parseTicketId(req.params.ticketId)

  if ('error' in result) {
    return res.status(
      result.error === 'Ticket not found' ? 404 : 400
    ).json({ message: result.error })
  }

  const { body } = req.body as { body?: string }

  if (!body || body.trim().length === 0) {
    return res.status(400).json({
      message: 'Message body is required',
    })
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: result.ticketId,
      body,
    },
  })

  return res.status(201).json(message)
})


