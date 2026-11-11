export type Profile = { id: string; full_name: string; phone: string | null; suburb: string | null; account_role: 'customer' | 'provider' | 'both'; is_admin: boolean };
export type Provider = { user_id: string; provider_type: 'individual' | 'business'; display_name: string; description: string | null; service_suburbs: string[]; is_verified: boolean; category_name?: string };
export type Job = { id: string; customer_id: string; title: string; description: string; suburb: string; status: string; created_at: string; category_id: string; category_name?: string };
export type Quote = { id: string; job_id: string; provider_id: string; amount: number; message: string; status: string; created_at: string; provider_name?: string; job_title?: string };
export type Booking = { id: string; job_id: string; customer_id: string; provider_id: string; quote_id: string; agreed_amount: number; status: string; job_title?: string; provider_name?: string };
export type Category = { id: string; name: string; icon: string };
