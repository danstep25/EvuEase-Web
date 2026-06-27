export interface PaymentSchemeInstallment {
  id?: string;
  installmentOrder: number;
  paymentName: string;
  dueDate: string;
}

export interface PaymentScheme {
  id: string;
  schoolYear: string;
  semester: string;
  description: string;
  installmentCount: number;
  installments: PaymentSchemeInstallment[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PaymentSchemeInstallmentInput {
  paymentName: string;
  dueDate: string;
}

export interface CreatePaymentSchemeRequest {
  schoolYear: string;
  semester: string;
  description?: string;
  installments: PaymentSchemeInstallmentInput[];
}

export interface UpdatePaymentSchemeRequest extends CreatePaymentSchemeRequest {
  id: string;
}
