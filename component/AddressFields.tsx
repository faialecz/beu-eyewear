'use client';

import TextField from '@/component/FormField';
import { ADDRESS_LIMITS, digitsOnly, normalizePhone, type AddressFields } from '@/lib/checkout/address';

interface AddressFieldsProps {
  // Prefill. Inputs are uncontrolled, so changing these only takes effect when
  // the parent remounts this component (e.g. via `key`).
  values: Partial<Record<keyof AddressFields, string>>;
  errors?: Record<string, string[] | undefined>;
}

// The six shipping-address inputs, shared by checkout and the address book.
export default function AddressFieldsInputs({ values, errors = {} }: AddressFieldsProps) {
  return (
    <>
      <TextField
        id="fullName"
        label="Full Name"
        autoComplete="name"
        maxLength={ADDRESS_LIMITS.fullName}
        required
        defaultValue={values.fullName}
        errors={errors.fullName}
      />
      <TextField
        id="address"
        label="Address"
        autoComplete="street-address"
        maxLength={ADDRESS_LIMITS.address}
        required
        defaultValue={values.address}
        errors={errors.address}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="city"
          label="City"
          autoComplete="address-level2"
          maxLength={ADDRESS_LIMITS.city}
          required
          defaultValue={values.city}
          errors={errors.city}
        />
        <TextField
          id="province"
          label="Province"
          autoComplete="address-level1"
          maxLength={ADDRESS_LIMITS.province}
          required
          defaultValue={values.province}
          errors={errors.province}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="zip"
          label="Zip / Postal Code"
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={ADDRESS_LIMITS.zip}
          onInput={(e) => {
            e.currentTarget.value = digitsOnly(e.currentTarget.value, ADDRESS_LIMITS.zip);
          }}
          required
          defaultValue={values.zip}
          errors={errors.zip}
        />
        {/* No maxLength here on purpose: the browser would cut a pasted "0917 123 4567" to
            11 characters (9 digits) before the filter below could strip the spaces. */}
        <TextField
          id="phone"
          label="Mobile Number"
          type="tel"
          autoComplete="tel"
          inputMode="numeric"
          placeholder="09171234567"
          onInput={(e) => {
            e.currentTarget.value = normalizePhone(e.currentTarget.value).slice(0, ADDRESS_LIMITS.phone);
          }}
          required
          defaultValue={values.phone}
          errors={errors.phone}
        />
      </div>
    </>
  );
}
