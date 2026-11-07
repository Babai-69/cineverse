import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Movies from './pages/Movies'
import Movie from './pages/Movie'
import Placeholder from './pages/Placeholder'
const Seats = lazy(()=>import('./pages/Seats'))   // 3D code loads only on this route
export default function App(){
  return <><Header/><main><ErrorBoundary><Suspense fallback={<div className="py-32 text-center text-muted">Loading…</div>}>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/movies" element={<Movies/>}/>
      <Route path="/movie/:id" element={<Movie/>}/>
      <Route path="/book/:showId/seats" element={<Seats/>}/>
      <Route path="/book/:showId/snacks" element={<Placeholder title="Snacks" day={8}/>}/>
      <Route path="/book/:showId/review" element={<Placeholder title="Review" day={8}/>}/>
      <Route path="/book/:showId/pay" element={<Placeholder title="Payment (demo)" day={8}/>}/>
      <Route path="/ticket/:ticketId" element={<Placeholder title="Ticket" day={8}/>}/>
      <Route path="/tickets" element={<Placeholder title="My tickets" day={8}/>}/>
      <Route path="*" element={<Placeholder title="404 — not found" day={1}/>}/>
    </Routes></Suspense></ErrorBoundary></main><Footer/></>
}
