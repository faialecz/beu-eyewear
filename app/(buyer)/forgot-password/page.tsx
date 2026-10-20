import { redirect } from 'next/navigation';
import ForgotPasswordForm from '@/component/ForgotPasswordForm';
import Reveal from '@/component/Reveal';
import { getCurrentUser } from '@/lib/auth/session';

export default async function ForgotPasswordPage() {
  // Signed-in users change their password from their profile.
  if (await getCurrentUser()) {
    redirect('/account/profile');
  }

  return (
    <Reveal mode="mount" className="mx-auto w-full max-w-md px-6 py-12">
      <div className="rounded-2xl border border-border bg-white px-6 py-8 shadow-lg sm:px-10 dark:bg-background">
        <ForgotPasswordForm />
      </div>
    </Reveal>
  );
}
