import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAgent } from '../middleware/requireAgent.js'
import { parseTicketSearchInput, SearchInputError } from '../services/search/searchInput.js'
import { searchTickets } from '../services/search/ticketSearchService.js'

export const searchRouter = Router()
searchRouter.use(requireAuth, requireAgent)

searchRouter.get('/tickets', async (req, res) => {
  try {
    const input = parseTicketSearchInput(req.query.q, req.query.cursor)
    const result = await searchTickets(input)
    return res.status(200).json(result)
  } catch (error) {
    if (error instanceof SearchInputError) {
      return res.status(400).json({ message: error.message })
    }

    console.error('Failed to search tickets', error)
    return res.status(500).json({ message: 'Something went wrong while searching tickets' })
  }
})