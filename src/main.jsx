import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ProfilePage from './ProfilePage.jsx'
import VetRegister from './VetRegister.jsx'
import HotelRegister from './HotelRegister.jsx'
import VencitelRegister from './VencitelRegister.jsx'
import VycvikRegister from './VycvikRegister.jsx'
import ProdejceRegister from './ProdejceRegister.jsx'
import PartneriPage from './PartneriPage.jsx'
import AdminPage from './AdminPage.jsx'
import VeterinariPage from './VeterinariPage.jsx'
import HotelyPage from './HotelyPage.jsx'
import VenceniPage from './VenceniPage.jsx'
import VycvikPage from './VycvikPage.jsx'
import SellerDashboard from './SellerDashboard.jsx'
import ShopPage from './ShopPage.jsx'
import PojisteniPage from './PojisteniPage.jsx'
import PartnerDetailPage from './PartnerDetailPage.jsx'
import PartnerDashboard from './PartnerDashboard.jsx'
import RadyPage from './RadyPage.jsx'
import RadyDetailPage from './RadyDetailPage.jsx'
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
          <Route path="/vycvik/registrace" element={<VycvikRegister />} />
          <Route path="/prodejce/registrace" element={<ProdejceRegister />} />
          <Route path="/partneri" element={<PartneriPage />} />
          <Route path="/admin-x7k9p2" element={<AdminPage />} />
          <Route path="/veterinari" element={<VeterinariPage />} />
          <Route path="/hotely" element={<HotelyPage />} />
          <Route path="/venceni" element={<VenceniPage />} />
          <Route path="/vycvik" element={<VycvikPage />} />
          <Route path="/pojisteni" element={<PojisteniPage />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/partner/dashboard" element={<PartnerDashboard />} />
          <Route path="/partner/:id" element={<PartnerDetailPage />} />
          <Route path="/rady" element={<RadyPage />} />
          <Route path="/rady/:slug" element={<RadyDetailPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)