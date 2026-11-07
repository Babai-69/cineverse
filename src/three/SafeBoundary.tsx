import { Component, type ReactNode } from 'react'
/** Generic "if this child crashes, render the fallback instead" boundary (used around the 3D canvas and texture loading). */
export default class SafeBoundary extends Component<{ children:ReactNode; fallback:ReactNode; onError?:(e:Error)=>void },{ failed:boolean }>{
  state = { failed:false }
  static getDerivedStateFromError(){ return { failed:true } }
  componentDidCatch(e:Error){ console.error('[cinehall:3d] crashed:', e.message); this.props.onError?.(e) }
  render(){ return this.state.failed ? this.props.fallback : this.props.children }
}
