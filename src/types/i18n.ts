export interface PluginI18n {
  openCalendar: string;
  tabName: string;
  placeholder: string;
  today: string;
  refreshHint: string;
  hint: string;
  selectMonth: string;
  selectYear: string;
  calendarView: string;
  heatmapView: string;
  heatmapHint: string;
  heatmapYearTotal: string;
  heatmapBlocks: string;
  heatmapNoNote: string;
  heatmapLess: string;
  heatmapMore: string;
  loading: string;
  noNotebooks: string;
  msg: {
    begin: string;
    notNoteBook: string;
    createFailed: string;
    refreshSuccess: string;
    refreshFailed: string;
  };
  position: {
    title: string;
    description: string;
    topLeft: string;
    topRight: string;
    dock: string;
  };
  settings: {
    title: string;
    description: string;
  };
  weekStart: {
    title: string;
    description: string;
    monday: string;
    sunday: string;
  };
  weekNumbers: {
    title: string;
    description: string;
  };
  taskMarkers: {
    title: string;
    description: string;
  };
}
