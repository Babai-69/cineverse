import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { vi } from 'vitest'
// jsdom has no WebGL: default to "no WebGL" everywhere (seats.test.tsx overrides per test).
vi.mock('../src/three/webgl', ()=>({ hasWebGL: vi.fn(()=>false) }))
import { useBooking, DEFAULT_LOCATION } from '../src/store/booking'
import { clearCinemaCache } from '../src/lib/geo'
afterEach(()=>{
  cleanup(); localStorage.clear(); vi.unstubAllGlobals(); clearCinemaCache()
  useBooking.setState({ location:DEFAULT_LOCATION, selectedShow:null, selectedTheatre:null, tickets:[], seats:[], seatsShowId:null, holdExpiresAt:null }) // store lives in memory across tests
})
