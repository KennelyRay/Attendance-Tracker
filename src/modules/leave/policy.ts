import type { LeaveType, LeaveTypePolicy } from '@/modules/leave/types';

export const leavePolicies: LeaveTypePolicy[] = [
  {
    value: 'paid-leave',
    label: 'Paid Leave (PL)',
    category: 'paid',
    description:
      'Flexible paid time off for illness, rest, appointments, errands, and personal matters.',
    paidBy: 'ICBS',
    filing:
      'Submit at least 5 working days ahead for planned leave. Notify your TL or HR as soon as possible for unplanned leave.',
    daysLabel: 'Uses your available paid leave balance',
    requiresPaidBalance: true,
    canUsePaidBalance: true,
  },
  {
    value: 'maternity-live-birth',
    label: 'Maternity Leave (Live Birth)',
    category: 'statutory',
    description:
      'Available to female employees regardless of civil status for normal or cesarean delivery.',
    paidBy: 'SSS',
    filing: 'Coordinate with HR as early as possible before the leave starts.',
    daysLabel: '105 paid days',
    maxDaysPerRequest: 105,
    requiresPaidBalance: false,
    canUsePaidBalance: false,
  },
  {
    value: 'maternity-miscarriage',
    label: 'Maternity Leave (Miscarriage)',
    category: 'statutory',
    description:
      'Covers miscarriage or emergency termination of pregnancy under the leave guide.',
    paidBy: 'SSS',
    filing: 'Coordinate with HR as early as possible before the leave starts.',
    daysLabel: '60 paid days',
    maxDaysPerRequest: 60,
    requiresPaidBalance: false,
    canUsePaidBalance: false,
  },
  {
    value: 'paternity',
    label: 'Paternity Leave',
    category: 'statutory',
    description:
      'Available to married male employees for the first four deliveries of their lawful wife.',
    paidBy: 'ICBS',
    filing: 'Must be used within 30 days of birth and backed by the required document.',
    daysLabel: '7 paid days per year',
    maxDaysPerYear: 7,
    requiresPaidBalance: false,
    canUsePaidBalance: false,
  },
  {
    value: 'solo-parent',
    label: 'Solo Parent Leave',
    category: 'statutory',
    description:
      'Available to employees with a valid Solo Parent ID and separate from the paid leave pool.',
    paidBy: 'ICBS',
    filing: 'Present your valid Solo Parent ID and follow the filing timing in the policy.',
    daysLabel: '7 paid days per year',
    maxDaysPerYear: 7,
    requiresPaidBalance: false,
    canUsePaidBalance: false,
  },
  {
    value: 'vawc',
    label: 'VAWC Leave',
    category: 'statutory',
    description:
      'Available to female employees who are victims of violence under RA 9262.',
    paidBy: 'ICBS',
    filing: 'Submit the VAWC leave form plus a supporting document when possible.',
    daysLabel: 'Up to 10 paid days per year',
    maxDaysPerYear: 10,
    requiresPaidBalance: false,
    canUsePaidBalance: false,
  },
  {
    value: 'mcw-special',
    label: 'MCW Special Leave',
    category: 'statutory',
    description:
      'Special leave for gynecologic surgery under RA 9710 and requires continuous service.',
    paidBy: 'ICBS',
    filing:
      'Planned leave. File at least 15 working days before surgery and submit medical documents after the procedure.',
    daysLabel: 'Up to 60 paid days',
    maxDaysPerYear: 60,
    requiresPaidBalance: false,
    canUsePaidBalance: false,
    minServiceMonths: 6,
  },
  {
    value: 'bereavement',
    label: 'Bereavement Leave',
    category: 'special',
    description:
      'Protected leave for death in the family. The allowed days depend on the relationship.',
    paidBy: 'Unpaid, protected from absence mark',
    filing: 'Notify your TL or HR immediately and submit the supporting document on return.',
    daysLabel: '1 to 5 days',
    maxDaysPerRequest: 5,
    requiresPaidBalance: false,
    canUsePaidBalance: false,
  },
  {
    value: 'calamity-emergency',
    label: 'Calamity / Emergency Leave',
    category: 'special',
    description:
      'Protected leave for typhoon, flooding, earthquake, or similar disaster affecting the employee.',
    paidBy: 'Unpaid, protected from absence mark',
    filing: 'Submit supporting proof such as a barangay or DRRM report within 72 hours.',
    daysLabel: 'Protected leave',
    requiresPaidBalance: false,
    canUsePaidBalance: false,
  },
  {
    value: 'court-summons',
    label: 'Court Summons Leave',
    category: 'civic',
    description:
      'Protected leave for official court or government appearances. Paid leave may be used if requested.',
    paidBy: 'Unpaid by default, or use Paid Leave to make it paid',
    filing: 'Present the official court summons in advance.',
    daysLabel: 'Duration of required appearance',
    requiresPaidBalance: false,
    canUsePaidBalance: true,
  },
  {
    value: 'military-reserve',
    label: 'Military / Reserve Duty Leave',
    category: 'civic',
    description:
      'Protected leave for official military, ROTC, or civil defense duty. Paid leave may be used if requested.',
    paidBy: 'Unpaid by default, or use Paid Leave to make it paid',
    filing: 'Present official military orders before deployment.',
    daysLabel: 'Duration of official duty',
    requiresPaidBalance: false,
    canUsePaidBalance: true,
  },
  {
    value: 'prc-board-exam',
    label: 'PRC Board Exam Leave',
    category: 'civic',
    description:
      'Protected leave for PRC licensure exam day(s). Paid leave may be used if requested.',
    paidBy: 'Use Paid Leave if you want it paid',
    filing: 'Submit proof of exam registration in advance.',
    daysLabel: 'Exam day(s)',
    requiresPaidBalance: false,
    canUsePaidBalance: true,
  },
];

export const leavePolicyByType = leavePolicies.reduce(
  (accumulator, policy) => {
    accumulator[policy.value] = policy;
    return accumulator;
  },
  {} as Record<LeaveType, LeaveTypePolicy>
);

export function getLeavePolicy(type: LeaveType) {
  return leavePolicyByType[type];
}
