import ChangePasswordForm from '@/component/account/ChangePasswordForm';
import ProfileForm from '@/component/account/ProfileForm';
import VerificationCard from '@/component/account/VerificationCard';
import { requireUser } from '@/lib/auth/session';

export default async function ProfilePage() {
  // Checked here rather than in account/layout.tsx so /account/wishlist
  // (localStorage-backed) stays usable without signing in.
  const user = await requireUser('/account/profile');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update your details, verify your email and change your password.</p>
      </div>

      <section aria-labelledby="details-heading" className="max-w-xl rounded-2xl border border-border p-6">
        <h2 id="details-heading" className="mb-4 text-lg font-bold">
          Your details
        </h2>
        <ProfileForm name={user.name} email={user.email} />
      </section>

      <section aria-labelledby="verify-heading" className="max-w-xl rounded-2xl border border-border p-6">
        <h2 id="verify-heading" className="mb-4 text-lg font-bold">
          Email verification
        </h2>
        <VerificationCard email={user.email} verified={Boolean(user.emailVerifiedAt)} />
      </section>

      <section aria-labelledby="password-heading" className="max-w-xl rounded-2xl border border-border p-6">
        <h2 id="password-heading" className="mb-4 text-lg font-bold">
          Change password
        </h2>
        <ChangePasswordForm />
        <p className="mt-4 text-xs text-muted-foreground">
          Changing your password signs you out of your other devices.
        </p>
      </section>
    </div>
  );
}
