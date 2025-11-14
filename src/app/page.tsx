
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth-server';
import UnauthLanding from '@/components/unauth-landing';

export default async function Home() {
  const session = await getSessionUser();
  if (session?.role === 'admin') {
    redirect('/admin/home');
  }
  if (session?.role === 'vendor') {
    redirect('/vendor/home');
  }
  if (session?.role === 'client') {
    redirect('/client/home');
  }
  return <UnauthLanding />;
}
