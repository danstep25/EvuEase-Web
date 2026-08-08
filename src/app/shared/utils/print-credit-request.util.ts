export const CREDIT_REQUEST_PRINT_BODY_CLASS = 'cr-print-credit-request';
const CREDIT_REQUEST_PRINT_TITLE = 'Course Credit Application Form';

export function printCreditRequestForm(onAfterPrint?: () => void): void {
  const root = document.documentElement;
  const previousTitle = document.title;

  root.classList.add(CREDIT_REQUEST_PRINT_BODY_CLASS);
  document.body.classList.add(CREDIT_REQUEST_PRINT_BODY_CLASS);
  document.title = CREDIT_REQUEST_PRINT_TITLE;

  const cleanup = (): void => {
    root.classList.remove(CREDIT_REQUEST_PRINT_BODY_CLASS);
    document.body.classList.remove(CREDIT_REQUEST_PRINT_BODY_CLASS);
    document.title = previousTitle;
    window.removeEventListener('afterprint', cleanup);
    onAfterPrint?.();
  };

  window.addEventListener('afterprint', cleanup);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.print());
  });
}
