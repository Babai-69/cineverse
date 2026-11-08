import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { pickSource, useTrailerVideo } from '../src/hooks/useTrailerVideo'

describe('pickSource', () => {
  const canOnly = (types:string[])=>({ canPlayType:(m:string)=> types.some(t=>m.startsWith(t)) ? 'probably' : '' })
  it('chooses the first playable file for this browser', () => {
    const list = ['/t.mp4','/t.webm']
    expect(pickSource(canOnly(['video/mp4']), list)).toBe('/t.mp4')       // Safari
    expect(pickSource(canOnly(['video/webm']), list)).toBe('/t.webm')     // Chromium without H.264
    expect(pickSource(canOnly([]), list)).toBe('/t.mp4')                  // nothing claims support: try the first anyway
  })
  it('unknown extensions are tried, empty list -> null, query strings ignored', () => {
    expect(pickSource(canOnly([]), ['/stream'])).toBe('/stream'); expect(pickSource(canOnly([]), [])).toBeNull()
    expect(pickSource(canOnly(['video/webm']), ['/a.mp4?x=1','/a.webm?x=1'])).toBe('/a.webm?x=1')
  })
})
describe('useTrailerVideo', () => {
  beforeEach(()=>{ (HTMLMediaElement.prototype.play as any).mockReset().mockResolvedValue(undefined); (HTMLMediaElement.prototype.pause as any).mockReset() })
  it('no source -> idle, no video', () => {
    const { result } = renderHook(()=>useTrailerVideo(undefined, true)); expect(result.current.video).toBeNull(); expect(result.current.state).toBe('idle')
  })
  it('creates a muted looping inline video and plays it when enabled', async () => {
    const { result } = renderHook(()=>useTrailerVideo('/t.mp4', true))
    await act(async()=>{})
    const v = result.current.video!
    expect(v.muted).toBe(true); expect(v.loop).toBe(true); expect(v.getAttribute('playsinline')).not.toBeNull()
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled(); expect(result.current.state).toBe('playing')
  })
  it('does NOT play while disabled (2D map shown) and plays once enabled', async () => {
    const { result, rerender } = renderHook(({on})=>useTrailerVideo('/t.mp4', on), { initialProps:{ on:false } })
    await act(async()=>{}); expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    rerender({ on:true }); await act(async()=>{}); expect(HTMLMediaElement.prototype.play).toHaveBeenCalled(); expect(result.current.state).toBe('playing')
  })
  it('autoplay blocked by the browser -> state "blocked"; the tap-to-play handler then starts it', async () => {
    (HTMLMediaElement.prototype.play as any).mockRejectedValueOnce(Object.assign(new Error('x'),{ name:'NotAllowedError' }))
    const { result } = renderHook(()=>useTrailerVideo('/t.mp4', true)); await act(async()=>{})
    expect(result.current.state).toBe('blocked')
    await act(async()=>{ result.current.play() }); expect(result.current.state).toBe('playing')
  })
  it('mute toggle flips video.muted and the reported state', async () => {
    const { result } = renderHook(()=>useTrailerVideo('/t.mp4', true)); await act(async()=>{})
    expect(result.current.muted).toBe(true)
    act(()=>result.current.toggleMute()); expect(result.current.muted).toBe(false); expect(result.current.video!.muted).toBe(false)
  })
  it('a video error is reported, not thrown', async () => {
    const { result } = renderHook(()=>useTrailerVideo('/t.mp4', true)); await act(async()=>{})
    act(()=>{ result.current.video!.dispatchEvent(new Event('error')) }); expect(result.current.state).toBe('error')
  })
})
