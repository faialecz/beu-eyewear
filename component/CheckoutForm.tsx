'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Clock } from 'lucide-react';
import { placeOrder } from '@/app/(buyer)/check-out/actions';
import AccordionSection from '@/component/AccordionSection';
import AddressFieldsInputs from '@/component/AddressFields';
import { buttonClassName } from '@/component/Button';
import { FieldLabel } from '@/component/FormField';
import ProductImage from '@/component/ProductImage';
import { lineKey, removeCartLines, useCartLines } from '@/lib/cart';
import { useResolvedCartItems } from '@/lib/cart-items';
import { MAX_SAVED_ADDRESSES, type AddressFields } from '@/lib/checkout/address';
import { PAYMENT_METHOD_IDS, PAYMENT_METHOD_LABELS, type PaymentMethodId } from '@/lib/checkout/payment';
import { calcTotals } from '@/lib/checkout/pricing';
import {
  SHIPPING_METHOD_IDS,
  SHIPPING_METHODS,
  deliveryEstimate,
  type ShippingMethodId,
} from '@/lib/checkout/shipping';
import type { SavedAddressRecord } from '@/lib/checkout/saved-address';
import type { PlaceOrderState } from '@/lib/checkout/types';
import { formatPrice } from '@/lib/format';

const initialState: PlaceOrderState = {};

// Card details are collected by the payment provider once PayMongo is wired
// in. These inputs deliberately have no `name`, so the browser never submits
// them to placeOrder.
function CardField({ id, label }: { id: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input id={id} type="text" className="w-full rounded-lg bg-muted px-4 py-3 text-sm outline-none" />
    </div>
  );
}

interface CheckoutFormProps {
  defaultName: string;
  // The buyer's address book, default first. The default prefills the form.
  savedAddresses: SavedAddressRecord[];
  // Cart line keys (slug::color) chosen on the cart page. Without them,
  // checkout covers the whole cart.
  selectedKeys?: string[];
}

// Value of the "Ship to" select for typing in an address by hand.
const NEW_ADDRESS = '';

export default function CheckoutForm({ defaultName, savedAddresses, selectedKeys }: CheckoutFormProps) {
  const router = useRouter();
  const cartLines = useCartLines();
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('CARD');
  const [promoCode, setPromoCode] = useState('');
  const [placed, setPlaced] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(
    savedAddresses.find((address) => address.isDefault)?.id ?? NEW_ADDRESS,
  );
  // The action state at the moment the buyer switched address. Until the next
  // submit, that switch wins over the values echoed back from the last one.
  const [switchedAt, setSwitchedAt] = useState<PlaceOrderState | null>(null);

  const lines = selectedKeys
    ? cartLines.filter((line) => selectedKeys.includes(lineKey(line.slug, line.color)))
    : cartLines;
  const { items, ready } = useResolvedCartItems(lines);
  const unavailableCount = lines.length - items.length;

  const [state, formAction, pending] = useActionState(
    async (prevState: PlaceOrderState, formData: FormData) => {
      const result = await placeOrder(prevState, formData);

      if (result.orderId) {
        // Swap to the "placed" panel first so clearing the cart doesn't flash
        // an empty checkout before the navigation lands.
        setPlaced(true);
        removeCartLines(items.map((item) => lineKey(item.slug, item.color)));
        router.push(`/order-confirm/${result.orderId}`);
      }
      return result;
    },
    initialState,
  );

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { shippingFee, total } = calcTotals(subtotal, shippingMethod);
  const orderLines = JSON.stringify(items.map(({ slug, color, quantity }) => ({ slug, color, quantity })));

  const fieldErrors = state.fieldErrors ?? {};
  // Prefill: what was just submitted (after an error), else the chosen saved address.
  const selectedAddress = savedAddresses.find((address) => address.id === selectedAddressId);
  const values: Partial<Record<keyof AddressFields, string>> =
    state.values && switchedAt !== state ? state.values : (selectedAddress ?? { fullName: defaultName });
  const canSaveAddress = !selectedAddress && savedAddresses.length < MAX_SAVED_ADDRESSES;
  // Ticked by default only when the address book is empty, so a one-off address
  // isn't added to it silently. After an error, keep whatever the buyer chose.
  const saveAddressChecked = state.values ? state.values.saveAddress === 'on' : savedAddresses.length === 0;
  const generalError = state.error ?? fieldErrors.lines?.[0];
  const canSubmit = ready && items.length > 0 && !pending;

  if (placed) {
    return <p className="py-14 text-center text-sm text-muted-foreground">Order placed — taking you to your confirmation…</p>;
  }

  if (ready && items.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-sm text-muted-foreground">
          {unavailableCount > 0 ? 'The items you selected are no longer available.' : 'You have nothing to check out yet.'}
        </p>
        <Link href="/cart" className={buttonClassName({ variant: 'primary', className: 'mt-6 uppercase' })}>
          Back to Cart
        </Link>
      </div>
    );
  }

  function renderErrorMessage() {
    return (
      <p aria-live="polite" className="mt-4 min-h-5 text-sm text-red-500">
        {generalError}
      </p>
    );
  }

  function renderOrderSummary(showPlaceOrder: boolean) {
    return (
      <>
        {!ready ? (
          <p className="text-sm text-muted-foreground">Loading your order…</p>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={lineKey(item.slug, item.color)}
                className="flex gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0"
              >
                <ProductImage imageUrl={item.imageUrl} alt={item.name} sizes="64px" className="h-16 w-16 shrink-0 rounded-lg" />
                <div className="flex flex-1 items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{item.name}</p>
                    {item.color && <p className="text-xs text-muted-foreground">Color: {item.color}</p>}
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {unavailableCount > 0 && ready && (
          <p className="mt-4 text-xs text-muted-foreground">
            {unavailableCount === 1 ? '1 item is' : `${unavailableCount} items are`} no longer available and left out
            of this order.
          </p>
        )}

        <div className="mt-4 flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between border-b border-border pb-4 text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
        </div>
        <div className="mt-4 flex justify-between font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <FieldLabel htmlFor="promo">Promo / Gift Card</FieldLabel>
          <div className="flex gap-2">
            <input
              id="promo"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              // This input lives inside the checkout <form>; Enter must not place the order.
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              placeholder="Enter code"
              className="w-full rounded-lg bg-muted px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-border px-4 text-sm text-muted-foreground hover:bg-muted"
            >
              Apply
            </button>
          </div>
        </div>

        {showPlaceOrder && (
          <>
            {renderErrorMessage()}
            <button
              type="submit"
              disabled={!canSubmit}
              className={buttonClassName({ variant: 'primary', className: 'mt-2 w-full uppercase' })}
            >
              {pending ? 'Placing order…' : 'Place Order'}
              {!pending && <ArrowRight size={16} />}
            </button>
          </>
        )}
      </>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <input type="hidden" name="lines" value={orderLines} />
      <input type="hidden" name="shippingMethod" value={shippingMethod} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />

      <div className="md:hidden">
        <AccordionSection title="Order Summary" defaultOpen>
          {renderOrderSummary(false)}
        </AccordionSection>
      </div>

      <div className="flex flex-col gap-10 md:col-span-2">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 shrink-0 rounded-full bg-muted" />
            <p className="text-sm font-bold uppercase tracking-wide">Shipping Address</p>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            {savedAddresses.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="savedAddress">Ship to</FieldLabel>
                {/* No name: the chosen address is submitted through the fields below. */}
                <select
                  id="savedAddress"
                  value={selectedAddressId}
                  onChange={(e) => {
                    setSelectedAddressId(e.target.value);
                    setSwitchedAt(state);
                  }}
                  className="w-full rounded-lg bg-muted px-4 py-3 text-sm outline-none"
                >
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label ?? address.fullName} — {address.address}, {address.city}
                      {address.isDefault ? ' (default)' : ''}
                    </option>
                  ))}
                  <option value={NEW_ADDRESS}>Enter a new address</option>
                </select>
                <Link href="/account/addresses" className="text-xs text-muted-foreground underline">
                  Manage address book
                </Link>
              </div>
            )}

            {/* Remounts on a different choice so the inputs pick up its values. */}
            <AddressFieldsInputs
              key={`${selectedAddressId}:${switchedAt === state}`}
              values={values}
              errors={fieldErrors}
            />

            {canSaveAddress && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="saveAddress"
                  defaultChecked={saveAddressChecked}
                  className="h-4 w-4 accent-foreground"
                />
                Save this address for next time
              </label>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 shrink-0 rounded-full bg-muted" />
            <p className="text-sm font-bold uppercase tracking-wide">Shipping Method</p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SHIPPING_METHOD_IDS.map((id) => {
              const option = SHIPPING_METHODS[id];
              const selected = shippingMethod === id;
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 ${
                    selected ? 'border-foreground' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {/* Display only: the chosen method is submitted via the hidden shippingMethod input. */}
                      <input
                        type="radio"
                        name="shipping-option"
                        checked={selected}
                        onChange={() => setShippingMethod(id)}
                        className="h-4 w-4 accent-foreground"
                      />
                      {option.label}
                    </span>
                    <span className="text-sm">{option.fee === 0 ? 'Free' : formatPrice(option.fee)}</span>
                  </div>
                  <p className="pl-6 text-xs text-muted-foreground">
                    {option.minDays}–{option.maxDays} Business Days
                  </p>
                  {selected && (
                    <p className="flex items-center gap-1 pl-6 text-xs text-muted-foreground">
                      <Clock size={12} />
                      {/* Depends on today's date, which can differ between server render and hydration. */}
                      <span suppressHydrationWarning>Arrives {deliveryEstimate(id)}</span>
                    </p>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 shrink-0 rounded-full bg-muted" />
            <p className="text-sm font-bold uppercase tracking-wide">Payment Method</p>
          </div>
          <div className="mt-6 flex gap-4">
            {PAYMENT_METHOD_IDS.map((id) => {
              const selected = paymentMethod === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(id)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${
                    selected ? 'border-foreground' : 'border-border text-muted-foreground'
                  }`}
                >
                  {PAYMENT_METHOD_LABELS[id]}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {paymentMethod === 'CARD' ? (
              <div className="flex flex-col gap-4">
                <CardField id="card-number" label="Card Number" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CardField id="expiry" label="Expiry Date" />
                  <CardField id="cvv" label="CVV" />
                </div>
                <CardField id="card-name" label="Name on Card" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You&apos;ll complete payment via {PAYMENT_METHOD_LABELS[paymentMethod]} at checkout.
              </p>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Payment isn&apos;t collected yet — your order will be saved as unpaid.
          </p>
        </div>

        <div className="md:hidden">
          {renderErrorMessage()}
          <button
            type="submit"
            disabled={!canSubmit}
            className={buttonClassName({ variant: 'primary', className: 'mt-2 w-full uppercase' })}
          >
            {pending ? 'Placing order…' : 'Place Order'}
            {!pending && <ArrowRight size={16} />}
          </button>
        </div>
      </div>

      <div className="hidden md:block md:sticky md:top-24 md:self-start">
        <div className="rounded-xl bg-muted p-6">
          <p className="text-sm font-bold uppercase tracking-wide">Order Summary</p>
          <div className="mt-4">{renderOrderSummary(true)}</div>
        </div>
      </div>
    </form>
  );
}
