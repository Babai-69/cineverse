import { Link, NavLink } from 'react-router-dom'
import { Ticket as TicketIcon } from 'lucide-react'
import LocationPicker from './LocationPicker'
export default function Header(){
  return (
    <header className="glass sticky top-0 z-50">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link to="/" className="font-display text-3xl tracking-widest text-accent">CINE<span className="text-white">HALL</span></Link>
        <nav className="hidden gap-6 text-sm text-muted md:flex">
          <NavLink to="/movies" className="hover:text-white">Movies</NavLink>
        </nav>
        <div className="flex items-center gap-3">
          <LocationPicker/>
          <Link to="/tickets" className="pill flex items-center gap-1 hover:text-white"><TicketIcon size={14}/> <span className="hidden sm:inline">My tickets</span></Link>
        </div>
      </div>
    </header>
  )
}
