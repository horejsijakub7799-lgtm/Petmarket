import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ProfilePage from './ProfilePage.jsx'
import VetRegister from './VetRegister.jsx'
import { AuthProvider } from './useAuth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/veterinar/registrace" element={<VetRegister />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)