import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
export const renderAt = (path:string)=>render(<MemoryRouter initialEntries={[path]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><App/></MemoryRouter>)
