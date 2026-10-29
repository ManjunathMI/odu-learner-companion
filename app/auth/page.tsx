import AuthForm from '@/components/AuthForm';
import { returnDestination } from '@/lib/return-destination';

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  return <AuthForm next={returnDestination(params.next ?? null)} initialError={params.error === 'link' ? 'This sign-in link is invalid or expired. Request a new link or enter the code from your email.' : ''} />;
}
