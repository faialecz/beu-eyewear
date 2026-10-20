import Link from 'next/link';
import ResetPasswordForm from '@/component/ResetPasswordForm';
import Reveal from '@/component/Reveal';
import { isTokenUsable } from '@/lib/auth/tokens';

export default async function ResetPasswordPage(props: PageProps<'/reset-password'>) {
  const { token } = await props.searchParams;
  const rawToken = typeof token === 'string' ? token : '';
  const valid = await isTokenUsable(rawToken, 'PASSWORD_RESET');

  return (
    <Reveal mode="mount" className="mx-auto w-full max-w-md px-6 py-12">
      <div className="rounded-2xl border border-border bg-white px-6 py-8 shadow-lg sm:px-10 dark:bg-background">
        {valid ? (
          <ResetPasswordForm token={rawToken} />
        ) : (
          <div className="text-center">
            <h1 className="text-base font-semibold">This link isn&apos;t valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Reset links expire after an hour and only work once. Request a new one to continue.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#8499D9] text-sm font-semibold text-white transition-colors hover:bg-[#6F86CF]"
            >
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </Reveal>
  );
}
