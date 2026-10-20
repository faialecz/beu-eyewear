'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { saveAddress } from '@/app/(buyer)/account/addresses/actions';
import AddressFieldsInputs from '@/component/AddressFields';
import { buttonClassName } from '@/component/Button';
import TextField from '@/component/FormField';
import { ADDRESS_LABEL_MAX, type AddressFields } from '@/lib/checkout/address';
import type { FormState } from '@/lib/auth/types';
import type { SavedAddressRecord } from '@/lib/checkout/saved-address';

const initialState: FormState = {};

interface AddressFormProps {
  // Present when editing; absent when adding.
  address?: SavedAddressRecord;
  // Pre-filled for a first address.
  defaultName?: string;
  // The first address is always the default.
  isFirst?: boolean;
}

export default function AddressForm({ address, defaultName, isFirst = false }: AddressFormProps) {
  const [state, formAction, pending] = useActionState(saveAddress, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  // What was just submitted (after an error), else the saved address.
  const values: Partial<Record<keyof AddressFields | 'label', string>> =
    state.values ?? (address ? { ...address, label: address.label ?? '' } : { fullName: defaultName });
  const alwaysDefault = isFirst || Boolean(address?.isDefault);
  const defaultChecked = alwaysDefault || (state.values ? state.values.isDefault === 'on' : false);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {address && <input type="hidden" name="id" value={address.id} />}

      <TextField
        id="label"
        label="Label (optional)"
        placeholder="Home, Office…"
        maxLength={ADDRESS_LABEL_MAX}
        defaultValue={values.label}
        errors={fieldErrors.label}
      />
      <AddressFieldsInputs values={values} errors={fieldErrors} />

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={defaultChecked}
          // A disabled box isn't submitted; the server keeps the default as is.
          disabled={alwaysDefault}
          className="h-4 w-4 accent-foreground"
        />
        {alwaysDefault ? 'This is your default address' : 'Use as my default address'}
      </label>

      <p aria-live="polite" className="min-h-5 text-sm text-red-500">
        {state.error}
      </p>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonClassName({ variant: 'primary' })}>
          {pending ? 'Saving…' : address ? 'Save Changes' : 'Add Address'}
        </button>
        <Link href="/account/addresses" className={buttonClassName({ variant: 'secondary' })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
