import {
  DEMO_ADMIN_ID,
  DEMO_EMPLOYEE_ID,
  demoAttendance,
  demoAuditLog,
  demoEmployees,
  demoHolidays,
  demoLeaveBalance,
  demoLeaveRequests,
  demoViolations,
} from '@/lib/demo/dataset';

export const DEMO_STATE_COOKIE = 'demo-state';

/**
 * What a visitor changed during their own visit.
 *
 * Test mode accepts writes so the workflows can actually be tried, but nothing is stored
 * on the server: the changes ride along in this one cookie, so each visitor gets their
 * own copy of the demo and nobody can leave a mess for the next person. Clearing it
 * (or signing out) puts the sample data back.
 */
export type DemoState = {
  /** Records edited in place, by collection and id. */
  edits?: Record<string, Record<string, Record<string, unknown>>>;
  /** Records added, by collection. */
  adds?: Record<string, Record<string, unknown>[]>;
  /** Record ids removed, by collection. */
  removes?: Record<string, number[]>;
};

/** Cookies are capped at 4KB, so the delta is trimmed before it can break the session. */
const MAX_STATE_CHARS = 3200;

export function parseDemoState(raw: string | undefined): DemoState {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as DemoState;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeDemoState(state: DemoState): string | null {
  const encoded = encodeURIComponent(JSON.stringify(state));
  if (encoded.length > MAX_STATE_CHARS) {
    // Drop the additions first: the demo stays usable, it just forgets the oldest ones.
    const trimmed: DemoState = { ...state, adds: {} };
    return encodeURIComponent(JSON.stringify(trimmed));
  }
  return encoded;
}

type Row = Record<string, unknown>;

function collection(state: DemoState, name: string, base: Row[]): Row[] {
  const edits = state.edits?.[name] ?? {};
  const removes = new Set(state.removes?.[name] ?? []);
  const adds = state.adds?.[name] ?? [];

  const merged = base
    .filter((row) => !removes.has(row.id as number))
    .map((row) => (edits[String(row.id)] ? { ...row, ...edits[String(row.id)] } : row));

  return [...adds.filter((row) => !removes.has(row.id as number)), ...merged];
}

function withEdit(state: DemoState, name: string, id: number, patch: Row): DemoState {
  const existingAdd = (state.adds?.[name] ?? []).find((row) => row.id === id);
  if (existingAdd) {
    return {
      ...state,
      adds: {
        ...state.adds,
        [name]: (state.adds?.[name] ?? []).map((row) => (row.id === id ? { ...row, ...patch } : row)),
      },
    };
  }

  return {
    ...state,
    edits: {
      ...state.edits,
      [name]: {
        ...(state.edits?.[name] ?? {}),
        [String(id)]: { ...(state.edits?.[name]?.[String(id)] ?? {}), ...patch },
      },
    },
  };
}

function withAdd(state: DemoState, name: string, row: Row): DemoState {
  return { ...state, adds: { ...state.adds, [name]: [row, ...(state.adds?.[name] ?? [])] } };
}

function withRemove(state: DemoState, name: string, id: number): DemoState {
  return { ...state, removes: { ...state.removes, [name]: [...(state.removes?.[name] ?? []), id] } };
}

/** Ids for anything a visitor creates, kept clear of the dataset's own negative ids. */
function newId() {
  return -Math.floor(Date.now() % 1_000_000) - 500_000;
}

function nowIso() {
  return new Date().toISOString();
}

export type DemoUser = { id: number; name: string; email: string; isAdmin: boolean };

export type DemoResult = {
  status: number;
  body: unknown;
  state?: DemoState;
};

/**
 * Answers an API request from the sample data.
 *
 * Returning null means "not a route test mode knows about", and the caller refuses the
 * request rather than letting it through to the real handler. Defaulting to refusal is
 * what keeps the guarantee simple: a test-mode session cannot reach the database, even
 * through a route added later.
 */
export function handleDemoRequest({
  pathname,
  method,
  searchParams,
  body,
  user,
  state,
}: {
  pathname: string;
  method: string;
  searchParams: URLSearchParams;
  body: Row | null;
  user: DemoUser;
  state: DemoState;
}): DemoResult | null {
  const employees = () => collection(state, 'employees', demoEmployees);
  const leave = () => collection(state, 'leave', demoLeaveRequests as unknown as Row[]);
  const violations = () => collection(state, 'violations', demoViolations as unknown as Row[]);
  const holidays = () => collection(state, 'holidays', demoHolidays as unknown as Row[]);
  const attendance = () => collection(state, 'attendance', demoAttendance as unknown as Row[]);
  const audit = () => collection(state, 'audit', demoAuditLog as unknown as Row[]);

  const adminOnly = (result: DemoResult): DemoResult =>
    user.isAdmin ? result : { status: 401, body: { error: 'Unauthorized' } };

  switch (`${method} ${pathname}`) {
    // ----- accounts -----
    case 'GET /api/admin/users':
      return adminOnly({ status: 200, body: { users: employees() } });

    case 'POST /api/admin/users': {
      const id = newId();
      const row = {
        id,
        name: String(body?.name ?? 'New employee'),
        email: String(body?.email ?? 'new.employee@example.test'),
        company: (body?.company as string) || null,
        position: (body?.position as string) || null,
        start_date: String(body?.startDate ?? nowIso().slice(0, 10)),
        is_banned: false,
        restricted_until: null,
        created_at: nowIso(),
        violation_count: 0,
        open_violation_count: 0,
      };
      return adminOnly({
        status: 201,
        body: { user: row },
        state: withAdd(state, 'employees', row),
      });
    }

    case 'PUT /api/admin/users': {
      const id = Number(body?.userId);
      const patch = {
        name: String(body?.name ?? ''),
        email: String(body?.email ?? ''),
        company: (body?.company as string) || null,
        position: (body?.position as string) || null,
        start_date: String(body?.startDate ?? ''),
      };
      const next = withEdit(state, 'employees', id, patch);
      const updated = collection(next, 'employees', demoEmployees).find((row) => row.id === id);
      return adminOnly({ status: 200, body: { user: updated }, state: next });
    }

    case 'PATCH /api/admin/users': {
      const id = Number(body?.userId);
      const action = String(body?.action ?? 'restore');
      const hours = Number(body?.durationHours ?? 24);
      const patch =
        action === 'ban'
          ? { is_banned: true, restricted_until: null }
          : action === 'restrict'
            ? {
                is_banned: false,
                restricted_until: new Date(Date.now() + hours * 3600_000).toISOString(),
              }
            : { is_banned: false, restricted_until: null };
      const next = withEdit(state, 'employees', id, patch);
      const updated = collection(next, 'employees', demoEmployees).find((row) => row.id === id);
      return adminOnly({ status: 200, body: { user: updated }, state: next });
    }

    case 'DELETE /api/admin/users':
      return adminOnly({
        status: 200,
        body: { success: true },
        state: withRemove(state, 'employees', Number(body?.userId)),
      });

    // ----- attendance -----
    case 'GET /api/admin/attendance': {
      const userId = Number(searchParams.get('userId'));
      const records = attendance()
        .filter((row) => row.user_id === userId)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
      return adminOnly({ status: 200, body: { records } });
    }

    case 'POST /api/admin/attendance': {
      const userId = Number(body?.userId);
      const date = String(body?.date ?? '');
      const existing = attendance().find((row) => row.user_id === userId && row.date === date);
      const patch = { status: String(body?.status ?? 'present'), notes: (body?.notes as string) || null };

      if (existing) {
        return adminOnly({
          status: 200,
          body: { success: true },
          state: withEdit(state, 'attendance', existing.id as number, patch),
        });
      }

      const owner = employees().find((row) => row.id === userId);
      return adminOnly({
        status: 200,
        body: { success: true },
        state: withAdd(state, 'attendance', {
          id: newId(),
          user_id: userId,
          user_name: owner?.name ?? 'Employee',
          date,
          created_at: nowIso(),
          ...patch,
        }),
      });
    }

    case 'GET /api/employee/attendance': {
      const month = searchParams.get('month');
      const year = searchParams.get('year');
      const mine = attendance()
        .filter((row) => row.user_id === user.id)
        .filter((row) => {
          if (!month || !year) return true;
          const [rowYear, rowMonth] = String(row.date).split('-');
          return rowYear === year && Number(rowMonth) === Number(month);
        })
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      const stats = { present: 0, absent: 0, 'half-day': 0, leave: 0 } as Record<string, number>;
      mine.forEach((row) => {
        const key = String(row.status);
        if (key in stats) stats[key] += 1;
      });

      return { status: 200, body: { records: mine, stats } };
    }

    // ----- leave -----
    case 'GET /api/admin/leave-requests':
      return adminOnly({ status: 200, body: { requests: leave() } });

    case 'PATCH /api/admin/leave-requests': {
      const id = Number(body?.requestId);
      const patch = {
        status: body?.action === 'approve' ? 'approved' : 'rejected',
        admin_notes: (body?.adminNotes as string) || null,
        reviewed_by: DEMO_ADMIN_ID,
        reviewed_at: nowIso(),
      };
      const next = withEdit(state, 'leave', id, patch);
      const updated = collection(next, 'leave', demoLeaveRequests as unknown as Row[]).find(
        (row) => row.id === id
      );
      return adminOnly({ status: 200, body: { request: updated }, state: next });
    }

    case 'GET /api/employee/leave-requests': {
      const mine = leave().filter((row) => row.user_id === user.id);
      return { status: 200, body: { balance: demoLeaveBalance, requests: mine } };
    }

    case 'POST /api/employee/leave-requests': {
      const row = {
        id: newId(),
        user_id: user.id,
        leave_type: String(body?.leaveType ?? 'paid-leave'),
        start_date: String(body?.startDate ?? ''),
        end_date: String(body?.endDate ?? ''),
        total_days: Number(body?.totalDays ?? 1),
        reason: String(body?.reason ?? ''),
        deduct_from_paid_balance: Boolean(body?.deductFromPaidBalance),
        status: 'pending',
        admin_notes: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: nowIso(),
        attachments: [],
        user_name: user.name,
        user_email: user.email,
        user_company: 'Northside Cafe',
        user_position: 'Shift Supervisor',
        user_start_date: demoLeaveBalance.startDate,
        user_leave_remaining: demoLeaveBalance.remaining,
        user_leave_entitlement: demoLeaveBalance.annualEntitlement,
      };
      return {
        status: 201,
        body: { request: row, balance: demoLeaveBalance },
        state: withAdd(state, 'leave', row),
      };
    }

    // ----- violations -----
    case 'GET /api/admin/violations':
      return adminOnly({ status: 200, body: { violations: violations() } });

    case 'POST /api/admin/violations': {
      const owner = employees().find((row) => row.id === Number(body?.userId));
      const row = {
        id: newId(),
        user_id: Number(body?.userId),
        user_name: owner?.name ?? 'Employee',
        user_email: owner?.email ?? 'employee@example.test',
        user_position: owner?.position ?? null,
        violation_type: String(body?.violationType ?? 'Policy breach'),
        company: (body?.company as string) || owner?.company || null,
        severity: String(body?.severity ?? 'low'),
        case_status: String(body?.caseStatus ?? 'open'),
        incident_date: String(body?.incidentDate ?? nowIso().slice(0, 10)),
        description: String(body?.description ?? ''),
        action_taken: (body?.actionTaken as string) || null,
        created_by: DEMO_ADMIN_ID,
        created_by_name: user.name,
        created_at: nowIso(),
        appeal_message: null,
        appealed_at: null,
        appeal_verdict: null,
        appeal_resolved_at: null,
      };
      return adminOnly({ status: 201, body: { violation: row }, state: withAdd(state, 'violations', row) });
    }

    case 'PATCH /api/admin/violations': {
      const id = Number(body?.violationId);
      const patch: Row =
        body?.verdict !== undefined
          ? { appeal_verdict: String(body.verdict), appeal_resolved_at: nowIso() }
          : {
              violation_type: String(body?.violationType ?? ''),
              company: (body?.company as string) || null,
              severity: String(body?.severity ?? 'low'),
              case_status: String(body?.caseStatus ?? 'open'),
              incident_date: String(body?.incidentDate ?? ''),
              description: String(body?.description ?? ''),
              action_taken: (body?.actionTaken as string) || null,
            };
      const next = withEdit(state, 'violations', id, patch);
      const updated = collection(next, 'violations', demoViolations as unknown as Row[]).find(
        (row) => row.id === id
      );
      return adminOnly({ status: 200, body: { violation: updated }, state: next });
    }

    case 'GET /api/employee/violations': {
      const mine = violations().filter((row) => row.user_id === user.id);
      return { status: 200, body: { violations: mine } };
    }

    case 'POST /api/employee/violations': {
      const id = Number(body?.violationId);
      const patch = { appeal_message: String(body?.message ?? ''), appealed_at: nowIso() };
      const next = withEdit(state, 'violations', id, patch);
      const updated = collection(next, 'violations', demoViolations as unknown as Row[]).find(
        (row) => row.id === id
      );
      return { status: 200, body: { violation: updated }, state: next };
    }

    // ----- holidays -----
    case 'GET /api/holidays':
      return {
        status: 200,
        body: {
          holidays: holidays().sort((a, b) => String(a.date).localeCompare(String(b.date))),
        },
      };

    case 'POST /api/holidays': {
      const row = {
        id: newId(),
        date: String(body?.date ?? ''),
        name: String(body?.name ?? 'Holiday'),
        holiday_type: String(body?.holidayType ?? 'regular'),
        created_at: nowIso(),
      };
      return adminOnly({ status: 201, body: { holiday: row }, state: withAdd(state, 'holidays', row) });
    }

    case 'DELETE /api/holidays':
      return adminOnly({
        status: 200,
        body: { success: true },
        state: withRemove(state, 'holidays', Number(body?.holidayId ?? body?.id)),
      });

    // ----- audit trail -----
    case 'GET /api/admin/audit-log': {
      const category = searchParams.get('category') ?? 'all';
      const search = (searchParams.get('search') ?? '').toLowerCase();
      const page = Math.max(1, Number(searchParams.get('page') ?? 1));
      const pageSize = Math.max(1, Number(searchParams.get('pageSize') ?? 20));

      const all = audit().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      const filtered = all.filter((row) => {
        if (category !== 'all' && row.category !== category) return false;
        if (!search) return true;
        return `${row.summary} ${row.actor_name} ${row.target_user_name ?? ''}`
          .toLowerCase()
          .includes(search);
      });

      const categoryCounts = { account: 0, attendance: 0, leave: 0, violation: 0 } as Record<
        string,
        number
      >;
      all.forEach((row) => {
        const key = String(row.category);
        if (key in categoryCounts) categoryCounts[key] += 1;
      });

      return adminOnly({
        status: 200,
        body: {
          events: filtered.slice((page - 1) * pageSize, page * pageSize),
          total: filtered.length,
          page,
          pageSize,
          categoryCounts,
        },
      });
    }

    // ----- profile -----
    case 'GET /api/employee/profile': {
      const me = employees().find((row) => row.id === user.id);
      return {
        status: 200,
        body: {
          user: {
            id: user.id,
            name: me?.name ?? user.name,
            email: me?.email ?? user.email,
            company: me?.company ?? null,
            position: me?.position ?? null,
            startDate: me?.start_date ?? demoLeaveBalance.startDate,
          },
        },
      };
    }

    // Push notifications need a real subscription against real VAPID keys, and there is
    // nothing to notify a sample account about.
    case 'POST /api/push/subscribe':
      return {
        status: 200,
        body: { success: true, demo: true },
      };

    default:
      return null;
  }
}

export const DEMO_IDS = { admin: DEMO_ADMIN_ID, employee: DEMO_EMPLOYEE_ID };
