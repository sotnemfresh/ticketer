import { Input } from '@/components/ui/input'

type TicketSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function TicketSearch({
  value,
  onChange,
}: TicketSearchProps) {
  return (
    <Input
      type="text"
      placeholder="Search tickets..."
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}