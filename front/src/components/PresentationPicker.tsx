import './PresentationPicker.css';
export default function PresentationPicker({ half, onChange, name }: {half:boolean;onChange:(value:boolean)=>void;name:string}) {
  return <div className="dl-presentation" role="group" aria-label={`Presentación de ${name}`}>
    <button type="button" aria-pressed={!half} onClick={()=>onChange(false)}>Entera</button>
    <button type="button" aria-pressed={half} onClick={()=>onChange(true)}>Media horma</button>
  </div>;
}
