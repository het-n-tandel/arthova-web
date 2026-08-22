import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageShell } from '@/components/layout/page-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  return <PageShell>{children}</PageShell>;
}
