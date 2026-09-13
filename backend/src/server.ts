import express, { Request, Response } from 'express'
import { ticketRouter } from './routers/ticketRoutes.js'
import { userRouter } from './routers/userRoutes.js'
import cors from 'cors'
import 'dotenv/config'

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.use(cors({
  origin: 'http://localhost:5173',
}))

app.use('/api/tickets', ticketRouter)
app.use('/api/users', userRouter)

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!')
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})

export default app