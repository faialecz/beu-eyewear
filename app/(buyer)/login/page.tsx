import { redirect } from 'next/navigation';
import LoginForm from '@/component/LoginForm';
import Reveal from '@/component/Reveal';
import { getCurrentUser, safeNextPath } from '@/lib/auth/session';

export default async function LoginPage(props: PageProps<'/login'>) {
  const { next, reset } = await props.searchParams;
  const nextPath = typeof next === 'string' ? safeNextPath(next) : undefined;

  // Already signed in, nothing to do here.
  if (await getCurrentUser()) {
    redirect(nextPath ?? '/account');
  }

  return (
    <Reveal mode="mount" className="mx-auto w-full max-w-md px-6 py-12">
      <div className="rounded-2xl border border-border bg-white px-6 py-8 shadow-lg sm:px-10 dark:bg-background">
        <LoginForm
          next={nextPath}
          headingAs="h1"
          notice={reset === '1' ? 'Password updated. Log in with your new password.' : undefined}
        />
      </div>
    </Reveal>
  );
}