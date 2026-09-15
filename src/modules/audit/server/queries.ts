import { getPool } from '@/lib/db';
import { ensureAuditLogSchema } from '@/lib/audit-log';
import type {
  AuditCategory,
  AuditEvent,
  AuditLogFilters,
  AuditLogPage,
} from '@/modules/audit/types';

const AUDIT_CATEGORIES: AuditCategory[] = ['account', 'attendance', 'leave', 'violation'];

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const AUDIT_EVENT_COLUMNS = `
  id,
  actor_id,
  actor_name,
  actor_email,
  category,
  action,
  target_user_id,
  target_user_name,
  entity_id,
  summary,
  details,
  created_at
`;

function emptyCategoryCounts(): Record<AuditCategory, number> {
  return { account: 0, attendance: 0, leave: 0, violation: 0 };
}

function normalizeFilters(filters: AuditLogFilters) {
  const category =
    filters.category && AUDIT_CATEGORIES.includes(filters.category as AuditCategory)
      ? (filters.category as AuditCategory)
      : 'all';

  const search = filters.search?.trim() ?? '';

  const requestedPageSize = Number(filters.pageSize);
  const pageSize =
    Number.isFinite(requestedPageSize) && requestedPageSize > 0
      ? Math.min(Math.floor(requestedPageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  const requestedPage = Number(filters.page);
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  return { category, search, page, pageSize };
}

export async function listAuditEvents(filters: AuditLogFilters = {}): Promise<AuditLogPage> {
  const pool = getPool();
  await ensureAuditLogSchema(pool);

  const { category, search, page, pageSize } = normalizeFilters(filters);

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (category !== 'all') {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    const pattern = `$${params.length}`;
    conditions.push(
      `(summary ILIKE ${pattern} OR actor_name ILIKE ${pattern} OR target_user_name ILIKE ${pattern})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM audit_log ${whereClause}`,
    params
  );
  const total = countResult.rows[0]?.total ?? 0;

  const offset = (page - 1) * pageSize;
  const pageResult = await pool.query(
    `
      SELECT ${AUDIT_EVENT_COLUMNS}
      FROM audit_log
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    [...params, pageSize, offset]
  );

  // Counts stay unfiltered by category so the filter chips always show the full picture,
  // but they do respect an active search.
  const countsParams: Array<string> = [];
  let countsWhere = '';
  if (search) {
    countsParams.push(`%${search}%`);
    countsWhere = `
      WHERE summary ILIKE $1 OR actor_name ILIKE $1 OR target_user_name ILIKE $1
    `;
  }

  const categoryCountsResult = await pool.query(
    `
      SELECT category, COUNT(*)::int AS total
      FROM audit_log
      ${countsWhere}
      GROUP BY category
    `,
    countsParams
  );

  const categoryCounts = emptyCategoryCounts();
  for (const row of categoryCountsResult.rows) {
    if (AUDIT_CATEGORIES.includes(row.category)) {
      categoryCounts[row.category as AuditCategory] = row.total;
    }
  }

  return {
    events: pageResult.rows as AuditEvent[],
    total,
    page,
    pageSize,
    categoryCounts,
  };
}
