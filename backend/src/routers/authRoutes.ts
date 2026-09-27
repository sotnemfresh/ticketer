import { Router, Request, Response } from 'express'
import { loginUser } from '../services/authService.js'
import { getUserById } from '../services/userService.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const authRoutes = Router()

authRoutes.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: 'email and password are required',
            })
        }

        const user = await loginUser(email, password)

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password',
            })
        }

        req.session.userId = user.id

        return res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            jobTitle: user.jobTitle,
        })
    } catch {
        return res.status(500).json({
            message: 'Something went wrong while logging in',
        })
    }
})

authRoutes.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: "Could not log out",
      });
    }

    res.clearCookie("connect.sid");

    return res.json({
      message: "Logged out successfully",
    });
  });
});

authRoutes.get('/me', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const user = await getUserById(userId)
        return res.status(200).json(user)
    } catch {
        return res.status(500).json({
            message: 'Something went wrong while fetching the current user',
        })
    }
});