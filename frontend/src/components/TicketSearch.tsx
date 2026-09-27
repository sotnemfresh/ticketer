type TicketSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function TicketSearch({
  value,
  onChange,
}: TicketSearchProps) {
  return (
    <input
      type="text"
      placeholder="Search tickets..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}