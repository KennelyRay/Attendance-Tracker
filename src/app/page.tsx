import { redirect } from 'next/navigation';
import { getSessionData } from '@/lib/session';

export default async function Home() {
  const session = await getSessionData();
  
  if (!session.user) {
    redirect('/login');
  }
  
  if (session.user.isAdmin) {
    redirect('/admin/dashboard');
  } else {
    redirect('/employee/dashboard');
  }
}
