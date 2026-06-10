import { BrowserRouter, Routes, Route } from 'react-router-dom'

import HomePage from './pages/HomePage'
import PresentationPage from './pages/PresentationPage'
import { Navigate } from 'react-router-dom'
function App() {
  return (
    <BrowserRouter>


      <Routes>

        <Route path="/" element={<HomePage />} />

        <Route path="/presentation" element={<PresentationPage />} />

        <Route

          path="*"

          element={<Navigate to="/" replace />}

        />

      </Routes>
    </BrowserRouter>
  )
}

export default App