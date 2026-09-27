import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import App from '../App'
import TicketsPage from '../pages/TicketsPage/TicketsPage'
import TicketDetailPage from '../pages/TicketDetailPage/TicketDetailPage'
import LoginPage from '../pages/LoginPage/LoginPage'

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
        {
            path: "login",
            element: <LoginPage />,
        },
      {
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <Navigate to="/tickets" replace />,
          },
          {
            path: "tickets",
            element: <TicketsPage />,
          },
          {
            path: "tickets/:ticketId",
            element: <TicketDetailPage />,
          },
        ],
      },
    ],
  },
]);