import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const paidLeaveProgression = [
  { years: 'New hire (Year 0)', days: '5 days' },
  { years: 'Year 1', days: '6 days' },
  { years: 'Year 3', days: '8 days' },
  { years: 'Year 5', days: '10 days' },
  { years: 'Year 10', days: '15 days' },
  { years: 'Year 20', days: '25 days and counting' },
];

const statutoryLeaves = [
  {
    title: 'Maternity Leave',
    days: '105 days (live birth) / 60 days (miscarriage)',
    paidBy: 'SSS',
    details:
      'Available to all female employees regardless of civil status. Covers normal and cesarean deliveries, plus miscarriage or emergency termination of pregnancy.',
    filing:
      'You may request an extra 30 unpaid days through HR before maternity starts. Up to 7 days may also be transferred to the father or an alternate caregiver through HR.',
  },
  {
    title: 'Paternity Leave',
    days: '7 paid days per year',
    paidBy: 'ICBS',
    details:
      'Available to married male employees for the first four deliveries of their lawful wife. Must be used within 30 days of birth.',
    filing:
      'Submit a birth certificate or hospital record to HR within 30 days.',
  },
  {
    title: 'Solo Parent Leave',
    days: '7 paid days per year',
    paidBy: 'ICBS',
    details:
      'Available to employees with a valid Solo Parent ID under RA 11861. This leave is separate from your Paid Leave pool.',
    filing:
      'Present your valid Solo Parent ID to HR. If the leave was unplanned, notify HR within 30 days.',
  },
  {
    title: 'VAWC Leave',
    days: 'Up to 10 paid days per year',
    paidBy: 'ICBS',
    details:
      'Available to female employees who are victims of violence under RA 9262. No advance notice is required and privacy is fully protected.',
    filing:
      'Submit the VAWC leave form plus a supporting document such as a barangay protection order, police report, or certification.',
  },
  {
    title: 'MCW Special Leave (Gynecologic Surgery)',
    days: 'Up to 60 paid days',
    paidBy: 'ICBS',
    details:
      'Available to female employees who undergo surgery for a gynecological disorder under RA 9710. Requires at least 6 months of continuous service.',
    filing:
      'This is planned leave. File at least 15 working days before surgery and submit the medical certificate within 30 days after the procedure.',
  },
];

const specialLeaves = [
  {
    title: 'Bereavement Leave',
    days: '1 to 5 days',
    paidBy: 'Unpaid, protected from absence mark',
    details:
      'Spouse, child, or parent: 5 days. Sibling, grandparent, or parent-in-law: 3 days. Extended family or close household member: 1 day.',
    filing:
      'Notify your TL or HR immediately. Submit a death certificate or funeral notice within 5 working days of returning to work.',
  },
  {
    title: 'Calamity / Emergency Leave',
    days: 'Protected leave',
    paidBy: 'Unpaid, protected from absence mark',
    details:
      'Covers absences caused by typhoon, flooding, earthquake, or similar disaster affecting your home or travel area.',
    filing:
      'Submit supporting proof such as an LGU or NDRRMC memo, or a barangay, police, fire, or DRRM report within 72 hours.',
  },
];

const civicLeaves = [
  {
    title: 'Court Summons Leave',
    days: 'Duration of required appearance',
    paidBy: 'Unpaid, or use Paid Leave to make it paid',
    details:
      'If you are summoned by a court or government body as a witness or party to a case, you may be excused for the required appearance.',
    filing: 'Present the official court summons to HR in advance.',
  },
  {
    title: 'Military / Reserve Duty Leave',
    days: 'Duration of official duty',
    paidBy: 'Unpaid, or use Paid Leave to make it paid',
    details:
      'Granted when you are called to active duty by the AFP, ROTC, or a recognized civil defense organization.',
    filing: 'Present official military orders to HR before deployment.',
  },
  {
    title: 'PRC Board Exam Leave',
    days: 'Exam day(s)',
    paidBy: 'Use Paid Leave if you want it paid',
    details:
      'Granted for your PRC licensure exam day(s). This leave protects your attendance while you sit for the exam.',
    filing: 'Submit proof of exam registration to HR in advance.',
  },
];

const quickReference = [
  ['Paid Leave (PL)', '5 days + 1 per year', 'ICBS', '5 days ahead for planned leave; notify next day for unplanned leave'],
  ['Maternity Leave', '105 / 60 days', 'SSS', 'As early as possible'],
  ['Maternity Extension', '+30 unpaid days', 'Unpaid', 'Request via HR before maternity starts'],
  ['Paternity Leave', '7 days', 'ICBS', 'Within 30 days of birth'],
  ['Solo Parent Leave', '7 days / year', 'ICBS', '5 days ahead if planned; 30 days if unplanned'],
  ['VAWC Leave', 'Up to 10 days / year', 'ICBS', 'No deadline and no advance notice required'],
  ['MCW Special Leave', 'Up to 60 days', 'ICBS', '15 working days ahead; documents within 30 days post-surgery'],
  ['Bereavement Leave', '1 to 5 days', 'Unpaid', 'Notify immediately; documents within 5 days of return'],
  ['Calamity / Emergency Leave', 'Protected leave', 'Unpaid', 'Documents within 72 hours'],
  ['Court Summons Leave', 'As required', 'Unpaid or use PL', 'Present summons in advance'],
  ['Military / Reserve Duty Leave', 'Duration of duty', 'Unpaid or use PL', 'Present orders in advance'],
  ['PRC Board Exam Leave', 'Exam day(s)', 'Use PL if paid', 'Submit exam registration in advance'],
];

const unpaidLeaveThresholds = [
  ['0 to 3 days', 'Normal usage', 'No action. This is within the normal range.'],
  ['4 to 5 days', 'Elevated usage', 'Coaching or reminder. HR or your TL may check in informally.'],
  ['6 to 8 days', 'Risk level', 'Written notice or counseling to discuss the pattern and next steps.'],
  ['9+ days', 'Operational risk', 'Management review and possible disciplinary action based on reliability and team impact.'],
];

const secondaryLinkClass =
  'inline-flex items-center justify-center rounded-xl bg-slate-900/85 px-4 py-2.5 text-sm font-medium text-slate-100 ring-1 ring-inset ring-slate-700/80 transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400';

export function LeavePolicyContent() {
  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-sky-500/12 text-sky-300 ring-1 ring-inset ring-sky-400/20">
                  Employee Guide
                </Badge>
                <Badge className="bg-cyan-500/12 text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                  ICBS
                </Badge>
                <Badge className="bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                  Law First
                </Badge>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                Leave Policy
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Everything you need to know about your time-off benefits in one place. This page is
                based on the employee leave guide in `Leave Policy.docx`. When Philippine law and
                company policy conflict, the law always wins.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Link href="/employee/dashboard" className={secondaryLinkClass}>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-sm font-semibold text-slate-100">Paid Leave Pool</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              Paid Leave is one flexible pool. You can use it for illness, rest, appointments,
              errands, or personal matters without separating &quot;sick&quot; and
              &quot;vacation&quot; leave.
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm font-semibold text-slate-100">Protected Leave</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              Statutory and protected leaves do not reduce your Paid Leave balance and should not
              be treated as an unexcused absence or used against your attendance incentives.
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm font-semibold text-slate-100">Documents Matter</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              Many unplanned or emergency leaves require supporting documents, often within 72
              hours. If you are unsure, contact HR immediately.
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="1. Paid Leave (PL)"
          subtitle="A single flexible pool that grows with your years of service."
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {paidLeaveProgression.map((item) => (
              <div
                key={item.years}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  {item.years}
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-50">{item.days}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5">
              <div className="text-sm font-semibold text-slate-100">How it grows</div>
              <div className="mt-2 text-sm leading-6 text-slate-400">
                The formula is 5 days required by law plus 1 additional day for every year of
                regular service. Unused Paid Leave at year-end converts to cash at your daily rate.
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5">
              <div className="text-sm font-semibold text-slate-100">How to file</div>
              <div className="mt-2 space-y-2 text-sm leading-6 text-slate-400">
                <div>Planned leave: submit at least 5 working days in advance through Humanity.</div>
                <div>Unplanned leave: notify your TL or HR as soon as possible.</div>
                <div>
                  For 3 or more consecutive sick days, submit a medical certificate within 72
                  hours.
                </div>
                <div>
                  Mental health is treated the same as physical health. A note from a licensed
                  psychologist, psychiatrist, or counselor is accepted.
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="2. Statutory Leaves"
          subtitle="Separate from your Paid Leave pool and guaranteed by law."
        />
        <CardBody>
          <div className="space-y-4">
            {statutoryLeaves.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-base font-semibold text-slate-100">{item.title}</div>
                    <div className="mt-1 text-sm text-sky-300">{item.days}</div>
                  </div>
                  <Badge className="bg-slate-950/90 text-slate-200 ring-1 ring-inset ring-slate-700">
                    Paid by {item.paidBy}
                  </Badge>
                </div>
                <div className="mt-3 text-sm leading-6 text-slate-400">{item.details}</div>
                <div className="mt-3 text-sm leading-6 text-slate-300">{item.filing}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="3. Special And Emergency Leaves"
            subtitle="Life events and emergencies that should not be treated as attendance violations."
          />
          <CardBody>
            <div className="space-y-4">
              {specialLeaves.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
                >
                  <div className="text-base font-semibold text-slate-100">{item.title}</div>
                  <div className="mt-1 text-sm text-sky-300">{item.days}</div>
                  <div className="mt-2 text-sm font-medium text-slate-300">{item.paidBy}</div>
                  <div className="mt-3 text-sm leading-6 text-slate-400">{item.details}</div>
                  <div className="mt-3 text-sm leading-6 text-slate-300">{item.filing}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="4. Civic And Professional Leaves"
            subtitle="Protected leave for legal, military, and professional obligations."
          />
          <CardBody>
            <div className="space-y-4">
              {civicLeaves.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
                >
                  <div className="text-base font-semibold text-slate-100">{item.title}</div>
                  <div className="mt-1 text-sm text-sky-300">{item.days}</div>
                  <div className="mt-2 text-sm font-medium text-slate-300">{item.paidBy}</div>
                  <div className="mt-3 text-sm leading-6 text-slate-400">{item.details}</div>
                  <div className="mt-3 text-sm leading-6 text-slate-300">{item.filing}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="5. Quick Reference"
          subtitle="Fast answers for days, payer, and filing expectations."
        />
        <CardBody>
          <div className="space-y-3">
            {quickReference.map(([type, days, paidBy, filing]) => (
              <div
                key={type}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{type}</div>
                    <div className="mt-1 text-sm text-sky-300">{days}</div>
                  </div>
                  <Badge className="bg-slate-950/90 text-slate-200 ring-1 ring-inset ring-slate-700">
                    {paidBy}
                  </Badge>
                </div>
                <div className="mt-3 text-sm leading-6 text-slate-400">{filing}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="6. Important Reminders"
            subtitle="Key rules that protect your leave usage and final pay."
          />
          <CardBody>
            <div className="space-y-4 text-sm leading-6 text-slate-400">
              <div>
                Statutory and protected leaves should never reset your attendance streak, block
                benefits, or be treated as unexcused absence.
              </div>
              <div>
                Most unplanned leaves need supporting documents within 72 hours. If you cannot
                submit on time, notify HR immediately and explain why.
              </div>
              <div>
                Unused Paid Leave converts to cash at year-end and is also included in final pay
                when you separate from the company.
              </div>
              <div>
                Mental health absences are treated the same as physical illness. You do not need to
                disclose your diagnosis, only that rest or treatment was advised.
              </div>
              <div>
                If you use 4 or more sick or emergency leave days in any 13-week period, HR may
                reach out for a confidential wellness check-in. This is support-focused, not
                disciplinary.
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="7. Unpaid Leave Usage Guide"
            subtitle="Only unprotected unpaid absences count toward these thresholds."
          />
          <CardBody>
            <div className="space-y-3">
              {unpaidLeaveThresholds.map(([days, level, action]) => (
                <div
                  key={days}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold text-slate-100">{days}</div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                      {level}
                    </div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">{action}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-amber-400/15 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100 ring-1 ring-inset ring-amber-400/20">
              Important: statutory and protected leaves such as maternity, paternity, solo parent,
              VAWC, SIL, bereavement, and calamity leave are not counted toward this threshold.
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
