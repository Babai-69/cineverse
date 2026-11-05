import type { Theatre } from './types'
export const cities = ["Chennai", "Bengaluru", "Hyderabad", "Kochi", "Mumbai"]
export const theatres: Theatre[] = [
  { id:'che-1', name:'Chennai Grand Cinemas', city:'Chennai', distanceKm:1.2, formats:['2D'], hallId:'hall-main' },
  { id:'che-2', name:'Chennai Luxe Screens', city:'Chennai', distanceKm:3.5, formats:['2D','4DX'], hallId:'hall-main' },
  { id:'che-3', name:'Chennai Orbit IMAX', city:'Chennai', distanceKm:5.8, formats:['2D','IMAX','4DX'], hallId:'hall-main' },
  { id:'che-4', name:'Chennai Regal Plaza', city:'Chennai', distanceKm:8.1, formats:['2D'], hallId:'hall-main' },
  { id:'ben-1', name:'Bengaluru Grand Cinemas', city:'Bengaluru', distanceKm:1.2, formats:['2D'], hallId:'hall-main' },
  { id:'ben-2', name:'Bengaluru Luxe Screens', city:'Bengaluru', distanceKm:3.5, formats:['2D','4DX'], hallId:'hall-main' },
  { id:'ben-3', name:'Bengaluru Orbit IMAX', city:'Bengaluru', distanceKm:5.8, formats:['2D','IMAX','4DX'], hallId:'hall-main' },
  { id:'ben-4', name:'Bengaluru Regal Plaza', city:'Bengaluru', distanceKm:8.1, formats:['2D'], hallId:'hall-main' },
  { id:'hyd-1', name:'Hyderabad Grand Cinemas', city:'Hyderabad', distanceKm:1.2, formats:['2D'], hallId:'hall-main' },
  { id:'hyd-2', name:'Hyderabad Luxe Screens', city:'Hyderabad', distanceKm:3.5, formats:['2D','4DX'], hallId:'hall-main' },
  { id:'hyd-3', name:'Hyderabad Orbit IMAX', city:'Hyderabad', distanceKm:5.8, formats:['2D','IMAX','4DX'], hallId:'hall-main' },
  { id:'hyd-4', name:'Hyderabad Regal Plaza', city:'Hyderabad', distanceKm:8.1, formats:['2D'], hallId:'hall-main' },
  { id:'koc-1', name:'Kochi Grand Cinemas', city:'Kochi', distanceKm:1.2, formats:['2D'], hallId:'hall-main' },
  { id:'koc-2', name:'Kochi Luxe Screens', city:'Kochi', distanceKm:3.5, formats:['2D','4DX'], hallId:'hall-main' },
  { id:'koc-3', name:'Kochi Orbit IMAX', city:'Kochi', distanceKm:5.8, formats:['2D','IMAX','4DX'], hallId:'hall-main' },
  { id:'koc-4', name:'Kochi Regal Plaza', city:'Kochi', distanceKm:8.1, formats:['2D'], hallId:'hall-main' },
  { id:'mum-1', name:'Mumbai Grand Cinemas', city:'Mumbai', distanceKm:1.2, formats:['2D'], hallId:'hall-main' },
  { id:'mum-2', name:'Mumbai Luxe Screens', city:'Mumbai', distanceKm:3.5, formats:['2D','4DX'], hallId:'hall-main' },
  { id:'mum-3', name:'Mumbai Orbit IMAX', city:'Mumbai', distanceKm:5.8, formats:['2D','IMAX','4DX'], hallId:'hall-main' },
  { id:'mum-4', name:'Mumbai Regal Plaza', city:'Mumbai', distanceKm:8.1, formats:['2D'], hallId:'hall-main' },
]
