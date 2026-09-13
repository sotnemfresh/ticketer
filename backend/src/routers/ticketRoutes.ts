import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { statusMap, priorityMap, type CreateTicketBody } from '../types/ticket.js'


export const ticketRouter = Router();


ticketRouter.get('/', async (req: Request, res: Response) => {
  const tickets = await prisma.ticket.findMany();
  res.json(tickets);
});

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

/*
ticketRouter.post('/', (req: Request, res: Response) => {

  const { subject, description, status, priority } = req.body;

  if (!subject || !description || !status || !priority) {
    return res.status(400).json({
      message: 'subject, description, status, and priority are required',
    });
  }

  const ticket = {
    id: tickets.length
      ? Math.max(...tickets.map((ticket) => ticket.id)) + 1
      : 1,
    subject,
    description,
    status,
    priority,
    createdAt: new Date(),
  };

  tickets.push(ticket);

  return res.status(201).json(ticket);

});
*/