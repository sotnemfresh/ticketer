import './App.css'
import AppLayout from './components/layout/AppLayout'
import { ThemeProvider } from "@/components/layout/theme-provider"


function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <main>
          <AppLayout />
        </main>
      </ThemeProvider>
    </>
  )
}

export default App
