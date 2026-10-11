import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import App from '../App'
import TicketListTable from '../pages/TicketsPage/TicketListTable'
import LoginPage from '../pages/LoginPage/LoginPage'
import TicketDetail from '../pages/TicketDetailPage/TicketDetail'

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
            element: <TicketListTable />,
          },
          {
            path: "tickets/:ticketId",
            element: <TicketDetail />,
          },
        ],
      },
    ],
  },
]);