import { Component, type ReactNode } from 'react'
/** Catches render errors so one broken page never white-screens the whole site. Details go to the console. */
export default class ErrorBoundary extends Component<{children:ReactNode},{error:Error|null}>{
  state = { error:null as Error|null }
  static getDerivedStateFromError(error:Error){ return { error } }
  componentDidCatch(error:Error, info:{componentStack?:string|null}){
    console.error('[cinehall:error] render failed:', error.message, '\nComponent stack:', info.componentStack)
  }
  render(){
    if(!this.state.error) return this.props.children
    return <section role="alert" className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-5xl">Something went wrong</h1>
      <p className="mt-2 text-muted">Please reload the page. (Open the console for details.)</p>
      <button className="btn mt-6" onClick={()=>{ this.setState({error:null}); location.assign('/') }}>Back to home</button></section>
  }
}
