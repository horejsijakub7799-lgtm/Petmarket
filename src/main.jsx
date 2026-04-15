import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ProfilePage from './ProfilePage.jsx'
import VetRegister from './VetRegister.jsx'
import HotelRegister from './HotelRegister.jsx'
import HlidaniRegister from './HlidaniRegister.jsx'
import VencitelRegister from './VencitelRegister.jsx'
import ProdejceRegister from './ProdejceRegister.jsx'
import PartneriPage from './PartneriPage.jsx'
import AdminPage from './AdminPage.jsx'
import VeterinariPage from './VeterinariPage.jsx'
import HotelyPage from './HotelyPage.jsx'
import VenceniPage from './VenceniPage.jsx'
import HlidaniPage from './HlidaniPage.jsx'
import SellerDashboard from './SellerDashboard.jsx'
import ShopPage from './ShopPage.jsx'
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
          <Route path="/hlidani/registrace" element={<HlidaniRegister />} />
          <Route path="/vencitel/registrace" element={<VencitelRegister />} />
          <Route path="/prodejce/registrace" element={<ProdejceRegister />} />
          <Route path="/partneri" element={<PartneriPage />} />
          <Route path="/admin-x7k9p2" element={<AdminPage />} />
          <Route path="/veterinari" element={<VeterinariPage />} />
          <Route path="/hotely" element={<HotelyPage />} />
          <Route path="/venceni" element={<VenceniPage />} />
          <Route path="/hlidani" element={<HlidaniPage />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/shop" element={<ShopPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)