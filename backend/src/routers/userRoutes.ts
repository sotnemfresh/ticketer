import { Router, Request, Response } from 'express'
import { createUser, getAllUsers, getUserById } from '../services/userService.js'
import type { CreateUserBody } from '../types/user.js'

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
userRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id)
    return res.status(200).json(user)
  } catch (error) {
    const err = error as { status?: number; message?: string }
    return res.status(err.status ?? 500).json({
      message: err.message ?? 'Something went wrong while fetching the user',
    })
  }
})
