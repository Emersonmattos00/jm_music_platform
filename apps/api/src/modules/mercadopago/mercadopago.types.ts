export interface MpPreapprovalResponse {
  id: string;
  status: string;
  init_point: string;
  sandbox_init_point: string;
  preapproval_plan_id?: string;
  external_reference?: string;
  payer_id?: string;
  reason?: string;
  auto_recurring: {
    frequency: number;
    frequency_type: 'days' | 'months';
    transaction_amount: number;
    currency_id: string;
  };
  date_created?: string;
  last_modified?: string;
  next_payment_date?: string;
}

export interface MpPaymentResponse {
  id: number | string;
  status:
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'cancelled'
    | 'refunded'
    | 'in_process'
    | 'charged_back';
  status_detail?: string;
  transaction_amount?: number;
  external_reference?: string;
  date_approved?: string;
  payment_method_id?: string;
  payment_type_id?: string;
}

// ----------------------------------------------------------
// CHECKOUT — Preference (pagamento avulso, ex.: aluguel)
// ----------------------------------------------------------
export interface MpPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
  external_reference?: string;
  client_id?: string;
  collector_id?: number;
  date_created?: string;
  items?: Array<{
    id?: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
}

export interface MpWebhookPayload {
  id?: number | string;
  live_mode?: boolean;
  type?: string;
  action?: string;
  data?: { id?: string | number };
  topic?: string;
  resource?: string;
  external_reference?: string;
}