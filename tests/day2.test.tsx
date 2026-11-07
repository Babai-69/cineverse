import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAt } from './helpers'
import { movies } from '../src/data/movies'
import { getShowsForTheatres } from '../src/lib/shows'
import { nearbyCuratedTheatres } from '../src/lib/theatres'
import { freezeTime } from './helpers'

describe('Movies page', () => {
  it('lists now-showing movies and switches to coming soon', async () => {
    renderAt('/movies')
    expect(screen.getByText('Midnight Raga')).toBeInTheDocument()
    expect(screen.queryByText('Crown of Dust')).not.toBeInTheDocument() // coming soon
    await userEvent.click(screen.getByRole('button',{name:'Coming soon'}))
    expect(screen.getByText('Crown of Dust')).toBeInTheDocument()
  })
  it('language filter narrows results', async () => {
    renderAt('/movies')
    await userEvent.click(within(screen.getByRole('group',{name:'Language'})).getByText('Hindi'))
    expect(screen.getByText('Iron Veil')).toBeInTheDocument()
    expect(screen.queryByText('Midnight Raga')).not.toBeInTheDocument()
  })
  it('format filter is real (IMAX only shows IMAX movies)', async () => {
    renderAt('/movies')
    await userEvent.click(within(screen.getByRole('group',{name:'Format'})).getByText('IMAX'))
    const shown = movies.filter(m=>m.nowShowing && m.formats.includes('IMAX'))
    const hidden = movies.filter(m=>m.nowShowing && !m.formats.includes('IMAX'))
    expect(hidden.length).toBeGreaterThan(0)
    shown.forEach(m=>expect(screen.getByText(m.title)).toBeInTheDocument())
    hidden.forEach(m=>expect(screen.queryByText(m.title)).not.toBeInTheDocument())
  })
  it('search with no match shows empty state and clear button restores', async () => {
    renderAt('/movies')
    await userEvent.type(screen.getByLabelText('Search movies'),'zzzz')
    expect(screen.getByText(/No movies match/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button',{name:'Clear filters'}))
    expect(screen.getByText('Midnight Raga')).toBeInTheDocument()
  })
})

describe('Movie page', () => {
  freezeTime('2026-11-07T08:00:00') // before the first show, so every chip is a link
  it('shows details and theatre board with showtime links', () => {
    renderAt('/movie/m1')
    expect(screen.getByRole('heading',{level:1,name:'Midnight Raga'})).toBeInTheDocument()
    expect(screen.getByText(/Theatres near Kolkata, West Bengal/)).toBeInTheDocument()
    const links = screen.getAllByRole('link').filter(a=>a.getAttribute('href')?.includes('/seats'))
    expect(links.length).toBeGreaterThan(10)
    expect(links[0].getAttribute('href')).toMatch(/^\/book\/m1_c\d+_\d{4}-\d{2}-\d{2}_\d{4}\/seats$/)
  })
  it('date change updates the board (different days -> different shows)', async () => {
    renderAt('/movie/m1')
    const before = screen.getAllByRole('link').map(a=>a.getAttribute('href')).join()
    await userEvent.click(screen.getAllByRole('tab')[1])
    const after = screen.getAllByRole('link').map(a=>a.getAttribute('href')).join()
    expect(after).not.toEqual(before)
  })
  it('only offers formats the movie supports', () => {
    renderAt('/movie/m1') // m1 = 2D + IMAX
    const group = screen.getByRole('group',{name:'Format'})
    expect(within(group).queryByText('4DX')).not.toBeInTheDocument()
    expect(within(group).getByText('IMAX')).toBeInTheDocument()
  })
  it('coming-soon movie has no showtimes', () => {
    renderAt('/movie/m11')
    expect(screen.getByText(/Bookings open closer to release/)).toBeInTheDocument()
  })
  it('unknown movie shows not-found state', () => {
    renderAt('/movie/nope')
    expect(screen.getByText('Movie not found')).toBeInTheDocument()
  })
})

describe('getShowsForTheatres', () => {
  const chennai = nearbyCuratedTheatres({lat:22.5726,lng:88.3639}, 25) // (Kolkata)
  it('respects movie formats', () => {
    const rows = getShowsForTheatres('m1',chennai,'2026-11-07',['2D','IMAX'])
    rows.forEach(r=>r.shows.forEach(s=>expect(['2D','IMAX']).toContain(s.format)))
  })
  it('is deterministic', () => {
    expect(getShowsForTheatres('m4',chennai,'2026-12-01',['2D'])).toEqual(getShowsForTheatres('m4',chennai,'2026-12-01',['2D']))
  })
})
