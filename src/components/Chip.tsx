export default function Chip({on,children,onClick}:{on:boolean;children:React.ReactNode;onClick:()=>void}){
  return <button onClick={onClick} aria-pressed={on}
    className={`pill transition ${on?'!border-accent !bg-accent !text-black':'hover:text-white'}`}>{children}</button>
}
