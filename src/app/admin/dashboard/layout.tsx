import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/session';
import { AppShell } from '@/components/layout/AppShell';

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSessionData();

  if (!session.user) {
    redirect('/login');
  }

  if (!session.user.isAdmin) {
    redirect('/employee/dashboard');
  }

  return (
    <AppShell user={session.user} title="Admin Dashboard" fullWidth>
      {children}
    </AppShell>
  );
}
