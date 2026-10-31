import * as React from 'react';
import { ChevronsUpDownIcon, Loader2Icon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useHost } from '@/lib/host';
import { useIsDark } from '@/hooks/use-is-dark';
import type { CalendarNotebook } from '@/api/notebook';

interface NotebookComboboxProps {
  notebooks: CalendarNotebook[];
  selectedNotebookId: string | undefined;
  loading: boolean;
  onSelect: (notebookId: string) => void;
}

export function NotebookCombobox({ notebooks, selectedNotebookId, loading, onSelect }: NotebookComboboxProps) {
  const { i18n } = useHost();
  const isDark = useIsDark();
  const [open, setOpen] = React.useState(false);
  const selectedNotebook = notebooks.find((notebook) => notebook.id === selectedNotebookId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={open}
        aria-label={i18n.placeholder}
        data-slot="notebook-combobox-trigger"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'w-[150px] justify-between bg-muted/40 font-normal hover:bg-muted/60'
        )}
      >
        <span className="truncate">{loading ? i18n.loading : (selectedNotebook?.name ?? i18n.placeholder)}</span>
        {loading ? (
          <Loader2Icon className="size-3.5 shrink-0 animate-spin opacity-60" />
        ) : (
          <ChevronsUpDownIcon className="size-3.5 shrink-0 opacity-60" />
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn('sy-calendar-portal z-[100000] w-[220px] gap-0 overflow-hidden p-0', isDark && 'dark')}
        data-slot="notebook-combobox-content"
      >
        <Command>
          <CommandInput placeholder={i18n.placeholder} />
          <CommandList>
            <CommandEmpty>{i18n.noNotebooks}</CommandEmpty>
            <CommandGroup>
              {notebooks.map((notebook) => (
                <CommandItem
                  key={notebook.id}
                  value={`${notebook.name} ${notebook.id}`}
                  data-checked={notebook.id === selectedNotebookId}
                  onSelect={() => {
                    onSelect(notebook.id);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{notebook.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
