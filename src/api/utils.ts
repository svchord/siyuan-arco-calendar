import { request } from './api';

export async function refreshSql() {
  return request('/api/sqlite/flushTransaction');
}
