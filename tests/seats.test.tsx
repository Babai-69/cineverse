import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderAt, freezeTime } from './helpers'
import { hasWebGL } from '../src/three/webgl'
import { useBooking } from '../src/store/booking'
import { getShowsForTheatres } from '../src/lib/shows'
import { withDistance } from '../src/lib/theatres'
import { theatres } from '../src/data/theatres'
import { soldSeatIds } from '../src/lib/hall'
import { priceSummary } from '../src/lib/pricing'

// The real WebGL canvas cannot run in jsdom (the real scene graph is tested in scene.test.tsx); this stub exposes the same props.
vi.mock('../src/three/HallCanvas', ()=>({ default:(p:any)=>{
  if ((globalThis as any).__crash3d) throw new Error('boom')
  return <div data-testid="hall3d"><button onClick={()=>p.onSeatClick('H8')}>stub-seat-H8</button><span data-testid="stub-selected">{p.selectedIds.join(',')}</span></div> } }))

const theatre = withDistance(theatres.filter(t=>t.id==='c64'), { lat:22.57, lng:88.36 })[0]           // INOX: Quest Mall, Kolkata
const show = getShowsForTheatres('m1',[theatre],'2026-11-10')[0].shows[0]
const path = `/book/${show.id}/seats`
const sold = soldSeatIds(show)
/** Seats page is lazy-loaded: wait for it. */
const open = async(p=path)=>{ renderAt(p); await screen.findByTestId('selected-show') }
const seatBtn = (id:string)=>screen.getByRole('button',{name:new RegExp(`^Row ${id[0]} seat ${id.slice(1)},`)})
const available = (n:number, pred:(id:string)=>boolean = ()=>true)=>
  [...screen.getByTestId('seatmap2d').querySelectorAll('button[data-state="available"]')].map(b=>{ const m = /Row (\w) seat (\d+)/.exec(b.getAttribute('aria-label')!)!; return m[1]+m[2] }).filter(pred).slice(0,n)

beforeEach(()=>{ (hasWebGL as any).mockReturnValue(false); delete (globalThis as any).__crash3d })

describe('Seat picker — selection (2D map = same logic as 3D)', () => {
  it('opens a database show directly by URL and shows theatre, time and the 2D fallback notice', async () => {
    await open()
    expect(screen.getByTestId('selected-show')).toHaveTextContent('INOX: Quest Mall')
    expect(screen.getByTestId('selected-show')).toHaveTextContent(show.time)
    expect(screen.getByText(/3D is not available in this browser/)).toBeInTheDocument()
    expect(screen.getByTestId('seatmap2d')).toBeInTheDocument()
  })
  it('selects seats, updates price summary + total exactly, and removes via the sidebar chip', async () => {
    await open()
    const [a,b] = available(2, id=>/^[C-H]/.test(id))
    await userEvent.click(seatBtn(a)); await userEvent.click(seatBtn(b))
    const sum = priceSummary([a,b], show)
    expect(screen.getByTestId('total')).toHaveTextContent(`₹${sum.total}`)
    expect(seatBtn(a)).toHaveAttribute('aria-pressed','true')
    expect(screen.getByRole('timer')).toHaveTextContent('8:00')
    await userEvent.click(screen.getByRole('button',{name:`Remove seat ${a}`}))
    expect(seatBtn(a)).toHaveAttribute('aria-pressed','false')
    expect(screen.getByTestId('total')).toHaveTextContent(`₹${priceSummary([b],show).total}`)
  })
  it('Continue is disabled with no seats and enabled after a pick', async () => {
    await open()
    expect(screen.getByRole('button',{name:/Continue to snacks/})).toBeDisabled()
    await userEvent.click(seatBtn(available(1)[0]))
    expect(screen.getByRole('button',{name:/Continue to snacks/})).toBeEnabled()
  })
  it('couple recliners select and deselect as a pair', async () => {
    await open()
    const a = available(1, id=>id[0]==='A' || id[0]==='B')[0]
    expect(a, 'fixture needs an unsold recliner').toBeTruthy()
    await userEvent.click(seatBtn(a))
    const partner = useBooking.getState().seats.find(s=>s!==a)!
    expect(useBooking.getState().seats).toHaveLength(2); expect(seatBtn(partner)).toHaveAttribute('aria-pressed','true')
    expect(within(screen.getByTestId('price-summary')).getByText(/Premium × 2/)).toBeInTheDocument()
    await userEvent.click(seatBtn(partner)); expect(useBooking.getState().seats).toHaveLength(0)
  })
  it('sold seats cannot be selected and explain why', async () => {
    await open()
    const id = [...sold].find(s=>s[0]!=='A' && s[0]!=='B')!
    const btn = seatBtn(id); expect(btn).toHaveAttribute('data-state','sold')
    await userEvent.click(btn)
    expect(await screen.findByText(/already taken/)).toBeInTheDocument(); expect(useBooking.getState().seats).toEqual([])
  })
  it('stops at 10 seats with a clear message', async () => {
    await open()
    const ids = available(11, id=>/^[C-H]/.test(id))
    for (const id of ids.slice(0,10)) await userEvent.click(seatBtn(id))
    expect(useBooking.getState().seats).toHaveLength(10)
    await userEvent.click(seatBtn(ids[10]))
    expect(await screen.findByText(/up to 10 seats/)).toBeInTheDocument(); expect(useBooking.getState().seats).toHaveLength(10)
  })
  it('hold expiry clears the seats and shows a banner', async () => {
    useBooking.setState({ seats:['H5'], seatsShowId:show.id, holdExpiresAt:Date.now()-1000 })
    await open()
    expect(await screen.findByText(/hold expired/)).toBeInTheDocument(); expect(useBooking.getState().seats).toEqual([]); expect(useBooking.getState().holdExpiresAt).toBeNull()
  })
  it('timer counts down every second', async () => {
    await open()                                      // load the lazy page first (real timers needed for the import)
    useBooking.setState({ seats:['H5'], seatsShowId:show.id, holdExpiresAt:Date.now()+61_000 })
    vi.useFakeTimers({ toFake:['Date','setInterval','clearInterval'] })
    useBooking.setState({ holdExpiresAt:Date.now()+61_000 })
    await act(async()=>{ vi.advanceTimersByTime(1) })
    expect(screen.getByRole('timer')).toHaveTextContent('1:01')
    await act(async()=>{ vi.advanceTimersByTime(2000) })
    expect(screen.getByRole('timer')).toHaveTextContent('0:59'); vi.useRealTimers()
  })
  it('a different show starts with an empty selection', async () => {
    useBooking.setState({ seats:['H5','H6'], seatsShowId:'some-other-show', holdExpiresAt:Date.now()+100000 })
    await open()
    expect(useBooking.getState().seats).toEqual([]); expect(screen.queryByTestId('price-summary')).not.toBeInTheDocument()
  })
  it('unknown / malformed show id shows a friendly page', async () => {
    renderAt('/book/garbage/seats'); expect(await screen.findByText('Show not found')).toBeInTheDocument()
  })
})

describe('Seat picker — 3D view wiring', () => {
  it('uses the 3D hall when WebGL exists; a 3D click selects, the 2D map shows the same selection', async () => {
    (hasWebGL as any).mockReturnValue(true)
    expect(sold.has('H8'), 'fixture: H8 must be unsold').toBe(false)
    renderAt(path)
    expect(await screen.findByTestId('hall3d')).toBeInTheDocument()
    await userEvent.click(screen.getByText('stub-seat-H8'))
    await waitFor(()=>expect(screen.getByTestId('stub-selected')).toHaveTextContent('H8'))
    await userEvent.click(screen.getByRole('button',{name:/2D map/}))
    expect(seatBtn('H8')).toHaveAttribute('aria-pressed','true'); expect(screen.getByTestId('total')).toBeInTheDocument()
  })
  it('if the 3D canvas crashes, the page falls back to the 2D map with an explanation', async () => {
    (hasWebGL as any).mockReturnValue(true); (globalThis as any).__crash3d = true
    const spy = vi.spyOn(console,'error').mockImplementation(()=>{})
    renderAt(path)
    expect(await screen.findByText(/3D hall could not start/, {}, { timeout:3000 })).toBeInTheDocument(); expect(screen.getByTestId('seatmap2d')).toBeInTheDocument()
    spy.mockRestore()
  })
})

describe('From the movie page to the seat picker', () => {
  freezeTime('2026-11-07T08:00:00')
  it('clicking a showtime opens the picker for that show with the theatre name', async () => {
    renderAt('/movie/m1')
    const link = screen.getAllByLabelText(/^\d\d:\d\d (2D|IMAX|4DX),/).find(c=>c.tagName==='A')!
    await userEvent.click(link)
    expect(await screen.findByTestId('seatmap2d')).toBeInTheDocument()
    expect(screen.getByTestId('selected-show')).toHaveTextContent(useBooking.getState().selectedTheatre!.name)
  })
})
