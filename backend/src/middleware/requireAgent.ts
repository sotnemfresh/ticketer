import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'

export async function requireAgent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId! },
      select: { role: true },
    })

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (user.role !== 'AGENT' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Agent access required' })
    }

    next()
  } catch (error) {
    console.error('Failed to check agent access', error)
    return res.status(500).json({ message: 'Something went wrong while checking access' })
  }
}