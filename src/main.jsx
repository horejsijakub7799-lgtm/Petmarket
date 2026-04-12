import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ProfilePage from './ProfilePage.jsx'
import VetRegister from './VetRegister.jsx'
import HotelRegister from './HotelRegister.jsx'
import VencitelRegister from './VencitelRegister.jsx'
import PartneriPage from './PartneriPage.jsx'
import { AuthProvider } from './useAuth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/veterinar/registrace" element={<VetRegister />} />
          <Route path="/hotel/registrace" element={<HotelRegister />} />
          <Route path="/vencitel/registrace" element={<VencitelRegister />} />
          <Route path="/partneri" element={<PartneriPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)