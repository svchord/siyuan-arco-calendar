import { openMobileFileById, openTab } from 'siyuan';
import type { App } from 'siyuan';

export function openDoc(app: App, docId: string, isMobile: boolean): void {
  if (isMobile) {
    openMobileFileById(app, docId, ['cb-get-all']);
    return;
  }
  void openTab({
    app,
    doc: {
      id: docId,
      zoomIn: false,
    },
  });
}
