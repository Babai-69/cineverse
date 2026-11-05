import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Movies from './pages/Movies'
import Placeholder from './pages/Placeholder'
export default function App(){
  return <><Header/><main>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/movies" element={<Movies/>}/>
      <Route path="/movie/:id" element={<Placeholder title="Movie page" day={2}/>}/>
      <Route path="/book/:showId/seats" element={<Placeholder title="3D seat picker" day={4}/>}/>
      <Route path="/book/:showId/snacks" element={<Placeholder title="Snacks" day={8}/>}/>
      <Route path="/book/:showId/review" element={<Placeholder title="Review" day={8}/>}/>
      <Route path="/book/:showId/pay" element={<Placeholder title="Payment (demo)" day={8}/>}/>
      <Route path="/ticket/:ticketId" element={<Placeholder title="Ticket" day={8}/>}/>
      <Route path="/tickets" element={<Placeholder title="My tickets" day={8}/>}/>
      <Route path="*" element={<Placeholder title="404 — not found" day={1}/>}/>
    </Routes></main><Footer/></>
}
