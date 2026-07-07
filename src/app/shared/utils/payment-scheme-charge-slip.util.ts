import { PaymentScheme, PaymentSchemeInstallment } from '../../core/models/payment-scheme.model';

export const CHARGE_SLIP_ENROLLMENT_LABEL = 'Upon Enrollment/Required DP';

export function sortPaymentSchemeInstallments(
  scheme: PaymentScheme
): PaymentSchemeInstallment[] {
  return [...scheme.installments].sort(
    (left, right) => left.installmentOrder - right.installmentOrder
  );
}

export function formatPaymentSchemeChargeSlipDate(iso: string | null | undefined): string {
  if (!iso?.trim()) {
    return '';
  }

  const normalized = iso.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split('-').map((part) => Number(part));
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return iso.trim();
  }
}

/** Charge-slip row label: enrollment row + due dates from configured installments. */
export function formatPaymentSchemeChargeSlipLabel(
  installment: PaymentSchemeInstallment,
  index: number
): string {
  if (index === 0) {
    return CHARGE_SLIP_ENROLLMENT_LABEL;
  }

  const dueDateLabel = formatPaymentSchemeChargeSlipDate(installment.dueDate);
  if (dueDateLabel) {
    return dueDateLabel;
  }

  const paymentName = installment.paymentName?.trim();
  if (paymentName) {
    return paymentName;
  }

  return `Installment ${index + 1}`;
}
