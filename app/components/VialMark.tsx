export function VialMark({ className = "" }: { className?: string }) {
  return (
    <span className={`sb-vial-mark ${className}`} aria-hidden="true">
      <i className="sb-vial-mark__cap" />
      <i className="sb-vial-mark__neck" />
      <i className="sb-vial-mark__body"><b /></i>
    </span>
  );
}
