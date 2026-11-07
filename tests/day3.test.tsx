import { describe, it, expect } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAt, freezeTime, mockGeolocation, mockFetch, DURGAPUR_OVERPASS, DURGAPUR_REVERSE } from './helpers'
import { useBooking } from '../src/store/booking'

const chips = ()=>screen.getAllByLabelText(/^\d\d:\d\d (2D|IMAX|4DX),/)
const names = ()=>screen.getAllByRole('heading',{level:3}).map(h=>h.textContent)
const openPicker = async()=>userEvent.click(screen.getByRole('button',{name:/Change location/}))

describe('Timeline showtimes', () => {
  freezeTime('2026-11-07T15:00:00')
  it('greys out started shows today and keeps later ones as links', () => {
    renderAt('/movie/m1')
    expect(chips().filter(c=>c.getAttribute('aria-disabled')==='true').length).toBeGreaterThan(0)
    expect(chips().filter(c=>c.tagName==='A').length).toBeGreaterThan(0)
  })
  it('colours chips by availability and shows the legend', () => {
    renderAt('/movie/m1')
    expect(screen.getByLabelText('Colour legend')).toHaveTextContent('Filling fast')
    expect(new Set(chips().map(c=>c.getAttribute('data-level'))).size).toBeGreaterThanOrEqual(2)
  })
  it('exactly one Smart pick; Nearest badge present', () => {
    renderAt('/movie/m1')
    expect(screen.getAllByText('Smart pick')).toHaveLength(1); expect(screen.getByText('Nearest')).toBeInTheDocument()
  })
  it('format filter limits chips', async () => {
    renderAt('/movie/m1')
    await userEvent.click(within(screen.getByRole('group',{name:'Format'})).getByText('IMAX'))
    chips().forEach(c=>expect(c.getAttribute('aria-label')).toContain('IMAX'))
  })
  it('clicking a showtime stores it and the seats page shows the choice', async () => {
    renderAt('/movie/m1')
    const link = chips().find(c=>c.tagName==='A')!
    await userEvent.click(link)
    expect(await screen.findByTestId('selected-show')).toHaveTextContent(useBooking.getState().selectedTheatre!.name)
    expect(useBooking.getState().selectedShow!.id).toBe(link.getAttribute('href')!.split('/')[2])
  })
})

describe('Real cinema database in the UI', () => {
  freezeTime('2026-11-07T08:00:00')
  it('default Kolkata list shows real venues, with area and approx. distance caption', () => {
    renderAt('/movie/m1')
    expect(screen.getByText('Theatres near Kolkata, West Bengal')).toBeInTheDocument()
    expect(names()).toContain('INOX: Quest Mall')
    expect(screen.getByText(/distances are measured to the city centre/)).toBeInTheDocument()
    expect(screen.getByText(/Ballygunge/)).toBeInTheDocument()
  })
  it('picking Durgapur from popular cities lists the 5 Durgapur cinemas and NO fictional names', async () => {
    renderAt('/movie/m1')
    await openPicker()
    await userEvent.click(screen.getByRole('button',{name:'Durgapur'}))
    expect(await screen.findByText('Theatres near Durgapur, West Bengal')).toBeInTheDocument()
    expect(names()).toEqual(expect.arrayContaining(['SVF Cinemas - Junction Mall','SVF Cinemas - Raj Sammilonee Mall','Durgapur Cinema','SSR Cinemas','Arti Cinemas']))
    expect(names().some(n=>/Grand Cinemas|Luxe Screens|Orbit IMAX|Regal Plaza/.test(n!))).toBe(false)
  })
  it('typing a city filters instantly from the database (offline) and selects it', async () => {
    renderAt('/movie/m1')
    await openPicker()
    await userEvent.type(screen.getByLabelText('Search a place'),'asan')
    await userEvent.click(within(screen.getByLabelText('Cities in our database')).getByRole('button',{name:/Asansol, West Bengal/}))
    expect(await screen.findByText('Theatres near Asansol, West Bengal')).toBeInTheDocument()
    expect(names()).toContain('Cinecosmo Sentrum Mall')
  })
  it('typing a PIN code finds its city', async () => {
    renderAt('/movie/m1'); await openPicker()
    await userEvent.type(screen.getByLabelText('Search a place'),'713103')
    expect(within(screen.getByLabelText('Cities in our database')).getByText(/Bardhaman, West Bengal/)).toBeInTheDocument()
  })
})

describe('GPS + search + live OpenStreetMap merge', () => {
  freezeTime('2026-11-07T08:00:00')
  it('GPS in Durgapur: instant database list, then merged with live cinemas (known venue upgraded, new one added)', async () => {
    mockGeolocation({ lat:23.5204, lng:87.3119 })
    mockFetch({ reverse:DURGAPUR_REVERSE, overpass:{ elements:[
      { type:'node', id:900, lat:23.5333, lon:87.3055, tags:{ name:'SVF Cinemas Junction Mall' } },        // matches our "SVF Cinemas - Junction Mall"
      { type:'node', id:901, lat:23.5100, lon:87.3300, tags:{ name:'Steel City Talkies' } } ] } })          // not in our database
    renderAt('/movie/m1'); await openPicker()
    await userEvent.click(screen.getByRole('button',{name:/Use my current location/}))
    expect(await screen.findByText('Theatres near Durgapur, West Bengal')).toBeInTheDocument()
    await waitFor(()=>expect(names()).toContain('Steel City Talkies'))
    const list = names()
    expect(list.filter(n=>/Junction Mall/.test(n!))).toHaveLength(1)                                   // not duplicated
    expect(list).toEqual(expect.arrayContaining(['Durgapur Cinema','SVF Cinemas - Raj Sammilonee Mall']))
    expect(list.some(n=>/Quest Mall/.test(n!))).toBe(false)                                            // Kolkata is far away
    expect(useBooking.getState().location.source).toBe('gps')
  })
  it('live lookup fails: database list stays visible with a notice (never blank)', async () => {
    mockGeolocation({ lat:23.5204, lng:87.3119 }); mockFetch({ reverse:DURGAPUR_REVERSE })              // overpass -> 500
    renderAt('/movie/m1'); await openPicker()
    await userEvent.click(screen.getByRole('button',{name:/Use my current location/}))
    expect(await screen.findByText(/Showing cinemas from our database/)).toBeInTheDocument()
    expect(names()).toContain('SVF Cinemas - Junction Mall')
  })
  it('place with no database cinemas and a failed lookup -> error with retry', async () => {
    mockFetch({ search:[{ lat:'26.9124', lon:'75.7873', address:{ city:'Jaipur', state:'Rajasthan' } }] })   // Jaipur is not in the database
    renderAt('/movie/m1'); await openPicker()
    await userEvent.type(screen.getByLabelText('Search a place'),'Jaipur')
    await userEvent.click(screen.getByRole('button',{name:'Go'}))
    await userEvent.click(await screen.findByRole('button',{name:/Jaipur, Rajasthan/}))
    expect(await screen.findByRole('button',{name:'Try again'})).toBeInTheDocument()
  })
  it('place with no database cinemas but live results (Jaipur) -> shows the live cinemas', async () => {
    mockFetch({ search:[{ lat:'26.9124', lon:'75.7873', address:{ city:'Jaipur', state:'Rajasthan' } }],
      overpass:{ elements:[{ type:'node', id:777, lat:26.91, lon:75.79, tags:{ name:'Raj Mandir Cinema' } }] } })
    renderAt('/movie/m1'); await openPicker()
    await userEvent.type(screen.getByLabelText('Search a place'),'Jaipur')
    await userEvent.click(screen.getByRole('button',{name:'Go'}))
    await userEvent.click(await screen.findByRole('button',{name:/Jaipur, Rajasthan/}))
    expect(await screen.findByText('Raj Mandir Cinema')).toBeInTheDocument()
  })
  it('GPS permission denied shows a helpful message and keeps the old location', async () => {
    mockGeolocation({ code:1 })
    renderAt('/movie/m1'); await openPicker()
    await userEvent.click(screen.getByRole('button',{name:/Use my current location/}))
    expect(await screen.findByRole('alert')).toHaveTextContent(/permission is blocked/i)
    expect(useBooking.getState().location.label).toBe('Kolkata, West Bengal')
  })
  it('"Clear my location" returns to Kolkata', async () => {
    useBooking.setState({ location:{ lat:19.1, lng:72.88, label:'Andheri, Maharashtra', source:'search' } })
    mockFetch({ overpass:{ elements:[] } })
    renderAt('/movie/m1'); await openPicker()
    await userEvent.click(screen.getByRole('button',{name:'Clear my location'}))
    expect(await screen.findByText('Theatres near Kolkata, West Bengal')).toBeInTheDocument()
  })
  it('radius select changes how far we look', async () => {
    renderAt('/movie/m1')
    await userEvent.selectOptions(screen.getByLabelText('Search radius'),'10')
    expect(screen.getByLabelText('Search radius')).toHaveValue('10')
  })
})
