import { Router, Request, Response } from 'express'
import { createUser, getAllUsers } from '../services/userService.js'
import type { CreateUserBody } from '../types/user.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAgent } from '../middleware/requireAgent.js'
import { getUserProfile, getUserProfileTickets } from '../services/users/userProfileService.js'
import { UserProfileError } from '../services/users/userProfileInput.js'


export const userRouter = Router()

/* --User handling-- */
/* Get all users */
userRouter.get('/', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers()
    return res.status(200).json(users)
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong while fetching users' })
  }
})

/* Create a new user */
userRouter.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreateUserBody
    const created = await createUser(body)
    return res.status(201).json(created)
  } catch (error) {
    const err = error as { status?: number; message?: string }
    return res.status(err.status ?? 500).json({
      message: err.message ?? 'Something went wrong while creating the user',
    })
  }
})

/* Get one user by id */
userRouter.get('/:id', requireAuth, requireAgent, async (req: Request, res: Response) => {
  try {
    const user = await getUserProfile(req.params.id)
    return res.status(200).json(user)
  } catch (error) {
    return respondToProfileError(res, error, 'Something went wrong while fetching the user')
  }
})

userRouter.get('/:id/tickets', requireAuth, requireAgent, async (req: Request, res: Response) => {
  try {
    const result = await getUserProfileTickets(req.params.id, req.query.cursor)
    return res.status(200).json(result)
  } catch (error) {
    return respondToProfileError(res, error, 'Something went wrong while fetching profile tickets')
  }
})

function respondToProfileError(res: Response, error: unknown, message: string) {
  if (error instanceof UserProfileError) {
    return res.status(error.status).json({ message: error.message })
  }
  console.error(message, error)
  return res.status(500).json({ message })
}
