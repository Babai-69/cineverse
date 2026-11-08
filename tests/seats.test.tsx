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
  return <div data-testid="hall3d" data-goal={JSON.stringify(p.cameraGoal ?? null)} data-tour={String(!!p.tour)} data-reduced={String(!!p.reducedMotion)}>
    <button onClick={()=>p.onSeatClick('H8')}>stub-seat-H8</button><button onClick={()=>p.onUserMove?.()}>stub-user-move</button>
    <span data-testid="stub-selected">{p.selectedIds.join(',')}</span></div> } }))

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
  it('a premium recliner can be booked on its own (one seat, one recliner price)', async () => {
    await open()
    const a = available(1, id=>id[0]==='A' || id[0]==='B')[0]
    expect(a, 'fixture needs an unsold recliner').toBeTruthy()
    await userEvent.click(seatBtn(a))
    expect(useBooking.getState().seats).toEqual([a])
    expect(within(screen.getByTestId('price-summary')).getByText(/Premium × 1/)).toBeInTheDocument()
    await userEvent.click(seatBtn(a)); expect(useBooking.getState().seats).toHaveLength(0)
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

const goal = ()=>JSON.parse(screen.getByTestId('hall3d').getAttribute('data-goal')!)
const btn = (name:RegExp|string)=>screen.getByRole('button',{name})

describe('✦ Best seats', () => {
  it('finds the best 2 seats next to each other, selects exactly those and tells the user', async () => {
    await open()
    await userEvent.click(btn(/Find best 2 seats/))
    const picked = useBooking.getState().seats
    expect(picked).toHaveLength(2)
    expect(picked[0][0]).toBe(picked[1][0])                                                       // same row
    expect(Math.abs(Number(picked[0].slice(1)) - Number(picked[1].slice(1)))).toBe(1)             // side by side
    picked.forEach(id=>expect(sold.has(id)).toBe(false))
    expect(await screen.findByText(/^Best 2 seats: /)).toBeInTheDocument()
    expect(screen.getByRole('timer')).toBeInTheDocument()                                          // hold timer started
  })
  it('the stepper changes the count (1–10) and the button label', async () => {
    await open()
    await userEvent.click(btn('More seats')); expect(btn(/Find best 3 seats/)).toBeInTheDocument()
    await userEvent.click(btn('Fewer seats')); await userEvent.click(btn('Fewer seats')); expect(btn(/Find best 1 seat$/)).toBeInTheDocument()
    expect(btn('Fewer seats')).toBeDisabled()
    for (let i=0;i<9;i++) await userEvent.click(btn('More seats'))
    expect(btn('More seats')).toBeDisabled(); expect(btn(/Find best 10 seats/)).toBeInTheDocument()
  })
  it('area filter: Premium gives recliner seats; replaces a previous selection instead of adding to it', async () => {
    await open()
    await userEvent.click(seatBtn(available(1, id=>/^[J-N]/.test(id))[0]))
    await userEvent.selectOptions(screen.getByLabelText('Seat area'),'Premium')
    await userEvent.click(btn(/Find best 2 seats/))
    const picked = useBooking.getState().seats
    expect(picked).toHaveLength(2); picked.forEach(id=>expect(['A','B']).toContain(id[0]))
  })
  it('explains when no group fits (10 recliners together) and keeps the current selection', async () => {
    await open()
    await userEvent.click(seatBtn(available(1)[0])); const before = useBooking.getState().seats
    await userEvent.selectOptions(screen.getByLabelText('Seat area'),'Premium')
    for (let i=0;i<8;i++) await userEvent.click(btn('More seats'))
    await userEvent.click(btn(/Find best 10 seats/))
    expect(await screen.findByText(/No 10 seats together in Premium\. The most together is 4/)).toBeInTheDocument()
    expect(useBooking.getState().seats).toEqual(before)
  })
  it('works in the 3D view too (same panel, same selection)', async () => {
    (hasWebGL as any).mockReturnValue(true)
    renderAt(path); await screen.findByTestId('hall3d')
    await userEvent.click(btn(/Find best 2 seats/))
    await waitFor(()=>expect(screen.getByTestId('stub-selected').textContent!.split(',')).toHaveLength(2))
  })
})

describe('camera buttons (3D view)', () => {
  const open3d = async()=>{ (hasWebGL as any).mockReturnValue(true); renderAt(path); await screen.findByTestId('hall3d') }
  it('shows the four presets, From my seat (disabled until a seat is picked) and the tour', async () => {
    await open3d()
    for (const n of ['Overview','From stage','Balcony',"Bird's eye"]) expect(btn(n)).toBeInTheDocument()
    expect(btn(/From my seat/)).toBeDisabled(); expect(btn('Auto tour')).toBeInTheDocument()
    expect(screen.getByRole('toolbar',{name:'Camera views'})).toBeInTheDocument()
  })
  it('a preset sends a new camera goal to the hall and highlights its button; each click is a new goal', async () => {
    await open3d()
    expect(btn('Overview')).toHaveAttribute('aria-pressed','true')                                  // default
    await userEvent.click(btn('From stage'))
    expect(goal()).toMatchObject({ kind:'preset', preset:'stage' }); expect(btn('From stage')).toHaveAttribute('aria-pressed','true'); expect(btn('Overview')).toHaveAttribute('aria-pressed','false')
    const id1 = goal().id; await userEvent.click(btn('From stage')); expect(goal().id).toBeGreaterThan(id1)   // re-click flies back
    await userEvent.click(btn("Bird's eye")); expect(goal().preset).toBe('bird')
  })
  it('From my seat flies to the LAST selected seat and is labelled with it', async () => {
    await open3d()
    await userEvent.click(btn(/Find best 3 seats|More seats/)); await userEvent.click(btn(/Find best 3 seats/))
    const seats = useBooking.getState().seats; const last = seats[seats.length-1]
    const b = await screen.findByRole('button',{name:new RegExp(`From seat ${last}`)}); expect(b).toBeEnabled()
    await userEvent.click(b); expect(goal()).toMatchObject({ kind:'seat', seatId:last }); expect(b).toHaveAttribute('aria-pressed','true')
    expect(screen.getByText(/look around from your seat/)).toBeInTheDocument()
  })
  it('auto tour toggles on/off; a preset click or the visitor grabbing the hall stops it', async () => {
    await open3d()
    await userEvent.click(btn('Auto tour')); expect(screen.getByTestId('hall3d')).toHaveAttribute('data-tour','true'); expect(btn('Stop tour')).toBeInTheDocument()
    await userEvent.click(btn('Stop tour')); expect(screen.getByTestId('hall3d')).toHaveAttribute('data-tour','false')
    await userEvent.click(btn('Auto tour')); await userEvent.click(btn('Balcony')); expect(screen.getByTestId('hall3d')).toHaveAttribute('data-tour','false')
    await userEvent.click(btn('Auto tour')); await userEvent.click(screen.getByText('stub-user-move')); expect(screen.getByTestId('hall3d')).toHaveAttribute('data-tour','false')
    expect(btn('Balcony')).toHaveAttribute('aria-pressed','false')                                  // free camera: no preset is highlighted
  })
  it('prefers-reduced-motion: no auto tour button, and moves are told to be instant', async () => {
    const orig = window.matchMedia; (window as any).matchMedia = (q:string)=>({ matches:/reduced-motion/.test(q), media:q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}, onchange:null, dispatchEvent:()=>false })
    await open3d()
    expect(screen.queryByRole('button',{name:'Auto tour'})).not.toBeInTheDocument(); expect(screen.getByTestId('hall3d')).toHaveAttribute('data-reduced','true')
    ;(window as any).matchMedia = orig
  })
  it('camera bar is not shown in the 2D map', async () => {
    renderAt(path); await screen.findByTestId('seatmap2d'); expect(screen.queryByRole('toolbar',{name:'Camera views'})).not.toBeInTheDocument()
  })
})
