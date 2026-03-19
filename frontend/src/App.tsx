import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import DashboardPage  from '@/pages/dashboard/DashboardPage'
import UploadPage     from '@/pages/upload/UploadPage'
import PlannerPage    from '@/pages/planner/PlannerPage'
import ListingsPage   from '@/pages/listings/ListingsPage'
import KeywordsPage   from '@/pages/keywords/KeywordsPage'
import ShopPage       from '@/pages/shop/ShopPage'
import ThumbnailPage  from '@/pages/thumbnail/ThumbnailPage'
import SettingsPage   from '@/pages/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<DashboardPage />} />
        <Route path="upload"     element={<UploadPage />} />
        <Route path="planner"    element={<PlannerPage />} />
        <Route path="listings"   element={<ListingsPage />} />
        <Route path="keywords"   element={<KeywordsPage />} />
        <Route path="shop"       element={<ShopPage />} />
        <Route path="thumbnail"  element={<ThumbnailPage />} />
        <Route path="settings"   element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
