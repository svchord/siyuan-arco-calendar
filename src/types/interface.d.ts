interface DailyNote {
  id: string;
  hpath: string;
}

type DeconstructDate = [string, string, string];

interface Notebook {
  id: string;
  name: string;
  closed: boolean;
}

interface ArcoOption {
  value: string;
  label: string;
  other: string;
}
