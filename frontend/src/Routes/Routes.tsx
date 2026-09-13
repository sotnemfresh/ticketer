import { createBrowserRouter, Navigate } from 'react-router-dom'
import App from '../App'
import TicketsPage from '../pages/TicketsPage/TicketsPage'
import TicketDetailPage from '../pages/TicketDetailPage/TicketDetailPage'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                index: true,
                element: <Navigate to="/tickets" replace />,
            },
            {
                path: 'tickets',
                element: <TicketsPage />,
            },
            {
                path: 'ticket/:ticketId',
                element: <TicketDetailPage />,
            },
        ],
    },
])