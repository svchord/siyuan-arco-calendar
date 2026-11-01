import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EntryPosition } from '@/lib/storage';
import { useHost } from '@/lib/host';
import { useIsDark } from '@/hooks/use-is-dark';
import { cn } from '@/lib/utils';

interface PositionSelectProps {
  value: EntryPosition;
  onChange: (value: EntryPosition) => void;
  className?: string;
}

export function PositionSelect({ value, onChange, className }: PositionSelectProps) {
  const { i18n } = useHost();
  const isDark = useIsDark();
  return (
    <Select value={value} onValueChange={(next) => onChange(next as EntryPosition)}>
      <SelectTrigger
        className={cn('w-[220px]', className)}
        aria-label={i18n.position.title}
        data-slot="position-select"
      >
        <SelectValue>
          {value === 'top-left'
            ? i18n.position.topLeft
            : value === 'top-right'
              ? i18n.position.topRight
              : i18n.position.dock}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={cn('sy-calendar-portal', isDark && 'dark')}>
        <SelectItem value="top-left">{i18n.position.topLeft}</SelectItem>
        <SelectItem value="top-right">{i18n.position.topRight}</SelectItem>
        <SelectItem value="dock">{i18n.position.dock}</SelectItem>
      </SelectContent>
    </Select>
  );
}
