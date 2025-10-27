import './CircleButton.css';

export default function CircleButton({ icon, label, onClick }) {
  return (
    <button className="circle-button" onClick={onClick}>
      <span className="circle-button__icon">{icon}</span>
      <span className="circle-button__label">{label}</span>
    </button>
  );
}