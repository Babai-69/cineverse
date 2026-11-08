import { describe, it, expect } from 'vitest'
import { PRESETS, PRESET_ORDER, TOUR_ORDER, nextTourPreset, seatPose, lookAhead, tweenPose, transitionMs, lerpVec, easeInOut, EYE_HEIGHT } from '../src/lib/camera'
import { HALL, HALL_DIMS, clampToHall } from '../src/lib/hall'

describe('camera presets', () => {
  it('has the four named presets in a fixed order', () => {
    expect(PRESET_ORDER).toEqual(['overview','stage','balcony','bird']); expect(PRESETS.bird.label).toBe("Bird's eye")
  })
  it('every preset camera position is already legal (the safety clamp would not move it)', () => {
    for (const id of PRESET_ORDER) expect(clampToHall(PRESETS[id].pose.pos), id).toEqual(PRESETS[id].pose.pos)
  })
  it('targets are inside the hall box', () => {
    for (const id of PRESET_ORDER){ const [x,y,z] = PRESETS[id].pose.target; expect(Math.abs(x)).toBeLessThan(HALL_DIMS.width/2); expect(y).toBeGreaterThan(-.01); expect(y).toBeLessThan(HALL_DIMS.height); expect(z).toBeGreaterThan(HALL_DIMS.frontZ-.01); expect(z).toBeLessThan(HALL_DIMS.backZ+.01) }
  })
  it("bird's eye is not straight down (looking exactly down makes orbit controls flip)", () => {
    const { pos, target } = PRESETS.bird.pose; expect(Math.hypot(pos[0]-target[0], pos[2]-target[2])).toBeGreaterThan(3)
  })
  it('auto tour visits every preset once, in order, and loops', () => {
    expect(TOUR_ORDER).toEqual(PRESET_ORDER)
    let i = 0; const seen = [TOUR_ORDER[i]]; for (let k=0;k<4;k++){ i = nextTourPreset(i); seen.push(TOUR_ORDER[i]) }
    expect(seen).toEqual(['overview','stage','balcony','bird','overview'])
  })
})
describe('"from my seat"', () => {
  it('every one of the 280 seats gives a legal eye position, above the seat, looking at the screen', () => {
    for (const s of HALL.seats){
      const p = seatPose(s)
      expect(clampToHall(p.pos), s.id).toEqual(p.pos)                              // not inside a wall/slab/floor
      expect(p.pos[1], s.id).toBeGreaterThan(s.pos[1]+EYE_HEIGHT-1e-6)              // eyes above the seat (never lowered by the clamp)
      expect(p.target).toEqual([0, HALL_DIMS.screenY, HALL_DIMS.screenZ])
    }
  })
  it('looks forward (towards the screen) from every seat', () => {
    for (const s of HALL.seats){ const p = seatPose(s); expect(p.target[2]-p.pos[2]).toBeLessThan(-3) }
  })
  it('lookAhead puts the orbit target a hair in front of the eyes, in the viewing direction', () => {
    const p = seatPose(HALL.byId.get('H8')!); const t = lookAhead(p, .05)
    expect(Math.hypot(t[0]-p.pos[0], t[1]-p.pos[1], t[2]-p.pos[2])).toBeCloseTo(.05, 5); expect(t[2]).toBeLessThan(p.pos[2])
  })
})
describe('straight-line moves', () => {
  const a = PRESETS.overview.pose, b = PRESETS.stage.pose
  it('starts at the first pose and ends at the second', () => {
    expect(tweenPose(a,b,0).pos).toEqual(a.pos); expect(tweenPose(a,b,1).pos).toEqual(b.pos); expect(tweenPose(a,b,1).target).toEqual(b.target)
  })
  it('p outside 0..1 is clamped', () => { expect(tweenPose(a,b,-5).pos).toEqual(a.pos); expect(tweenPose(a,b,9).pos).toEqual(b.pos) })
  it('every intermediate point is legal, for every pair of presets and every seat view (fuzz)', () => {
    const poses = [...PRESET_ORDER.map(id=>PRESETS[id].pose), ...HALL.seats.filter((_,i)=>i%9===0).map(seatPose)]
    for (const from of poses) for (const to of poses) for (let k=0;k<=10;k++){
      const { pos } = tweenPose(from,to,k/10); expect(clampToHall(pos)).toEqual(pos)
    }
  })
  it('moves along a straight line when nothing needs clamping (collinear points)', () => {
    const mid = tweenPose(PRESETS.overview.pose, PRESETS.balcony.pose, .5)
    const t = easeInOut(.5), want = lerpVec(PRESETS.overview.pose.pos, PRESETS.balcony.pose.pos, t)
    expect(mid.pos[0]).toBeCloseTo(want[0],6); expect(mid.pos[1]).toBeCloseTo(want[1],6); expect(mid.pos[2]).toBeCloseTo(want[2],6)
  })
  it('longer trips take longer (0.7–1.7 s); reduced motion = instant', () => {
    expect(transitionMs([0,0,0],[0,0,1])).toBe(700); expect(transitionMs([0,0,0],[0,0,100])).toBe(1700)
    expect(transitionMs(a.pos,b.pos)).toBeGreaterThan(700); expect(transitionMs(a.pos,b.pos,true)).toBe(0)
  })
})
