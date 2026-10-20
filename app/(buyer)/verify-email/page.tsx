import Link from 'next/link';
import ConfirmEmailForm from '@/component/ConfirmEmailForm';
import Reveal from '@/component/Reveal';
import { isTokenUsable } from '@/lib/auth/tokens';

export default async function VerifyEmailPage(props: PageProps<'/verify-email'>) {
  const { token } = await props.searchParams;
  const rawToken = typeof token === 'string' ? token : '';
  const valid = await isTokenUsable(rawToken, 'EMAIL_VERIFY');

  return (
    <Reveal mode="mount" className="mx-auto w-full max-w-md px-6 py-12">
      <div className="rounded-2xl border border-border bg-white px-6 py-8 shadow-lg sm:px-10 dark:bg-background">
        {valid ? (
          <ConfirmEmailForm token={rawToken} />
        ) : (
          <div className="text-center">
            <h1 className="text-base font-semibold">This link isn&apos;t valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Confirmation links expire after 24 hours and only work once. Sign in and request a new one from your
              profile.
            </p>
            <Link
              href="/account/profile"
              className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-[#8499D9] text-sm font-semibold text-white transition-colors hover:bg-[#6F86CF]"
            >
              Go to your profile
            </Link>
          </div>
        )}
      </div>
    </Reveal>
  );
}
