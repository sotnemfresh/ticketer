import express, { Request, Response } from 'express'
import session from 'express-session'
import { ticketRouter } from './routers/ticketRoutes.js'
import { userRouter } from './routers/userRoutes.js'
import { authRoutes } from './routers/authRoutes.js'
import cors from 'cors'
import 'dotenv/config'

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
//  cookie: { secure: false } // Set to true if using HTTPS
}))

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use('/api/tickets', ticketRouter)
app.use('/api/users', userRouter)
app.use("/api/auth", authRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!')
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})

export default app