import { Route, Routes } from 'react-router-dom'
import SiteLayout from './components/SiteLayout'
import AdminPage from './pages/Admin'
import AboutPage from './pages/About'
import ContactPage from './pages/Contact'
import HomePage from './pages/Home'
import PortfolioPage from './pages/Portfolio'
import ServicesPage from './pages/Services'

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
    </Routes>
  )
}

export default App
