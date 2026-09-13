import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';


export const ticketRouter = Router();


ticketRouter.get('/', async (req: Request, res: Response) => {
  const tickets = await prisma.ticket.findMany();
  res.json(tickets);
});

ticketRouter.post('/', (req: Request, res: Response) => {
/*
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
  */
});