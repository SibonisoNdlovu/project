import { supabase } from '../lib/supabase';
import type { Booking, Category, Job, Provider, Quote } from '../types';

export const marketplace = {
  async categories(): Promise<Category[]> {
    const { data, error } = await supabase.from('service_categories').select('id,name,icon').eq('is_active', true).order('name');
    if (error) throw error; return data ?? [];
  },
  async providers(): Promise<Provider[]> {
    const { data, error } = await supabase.from('provider_profiles').select('user_id,provider_type,display_name,description,service_suburbs,is_verified').order('display_name');
    if (error) throw error; return data ?? [];
  },
  async jobs(): Promise<Job[]> {
    const { data, error } = await supabase.from('job_requests').select('id,customer_id,title,description,suburb,status,created_at,category_id,service_categories(name)').eq('status','open').order('created_at',{ascending:false});
    if (error) throw error;
    return (data ?? []).map((item: any) => ({...item, category_name: item.service_categories?.name ?? 'Service'}));
  },
  async myJobs(userId: string): Promise<Job[]> {
    const { data, error } = await supabase.from('job_requests').select('id,customer_id,title,description,suburb,status,created_at,category_id').eq('customer_id',userId).order('created_at',{ascending:false});
    if (error) throw error; return data ?? [];
  },
  async createJob(input: { customer_id: string; category_id: string; title: string; description: string; suburb: string }) {
    const { error } = await supabase.from('job_requests').insert({...input, status:'open'});
    if (error) throw error;
  },
  async createProvider(input: { user_id: string; provider_type: 'individual'|'business'; display_name: string; description: string; service_suburbs: string[] }) {
    const { error } = await supabase.from('provider_profiles').upsert(input);
    if (error) throw error;
  },
  async submitQuote(input: { job_id: string; provider_id: string; amount: number; message: string }) {
    const { error } = await supabase.from('quotations').insert({...input, status:'pending'});
    if (error) throw error;
  },
  async quotesForJob(jobId: string): Promise<Quote[]> {
    const { data, error } = await supabase.from('quotations').select('id,job_id,provider_id,amount,message,status,created_at,provider_profiles(display_name)').eq('job_id',jobId).order('created_at');
    if (error) throw error; return (data ?? []).map((q: any) => ({...q, provider_name:q.provider_profiles?.display_name ?? 'Provider'}));
  },
  async myQuotes(userId: string): Promise<Quote[]> {
    const { data, error } = await supabase.from('quotations').select('id,job_id,provider_id,amount,message,status,created_at,job_requests(title)').eq('provider_id',userId).order('created_at',{ascending:false});
    if (error) throw error; return (data ?? []).map((q: any) => ({...q, job_title:q.job_requests?.title ?? 'Job'}));
  },
  async customerQuotes(userId: string): Promise<Quote[]> {
    const { data: jobs, error: jobsError } = await supabase.from('job_requests').select('id,title').eq('customer_id',userId);
    if (jobsError) throw jobsError;
    if (!jobs?.length) return [];
    const jobIds = jobs.map((job: any) => job.id);
    const { data, error } = await supabase.from('quotations').select('id,job_id,provider_id,amount,message,status,created_at,provider_profiles(display_name)').in('job_id',jobIds).order('created_at',{ascending:false});
    if (error) throw error;
    const titles = new Map(jobs.map((job: any) => [job.id, job.title]));
    return (data ?? []).map((q: any) => ({...q, job_title:titles.get(q.job_id) ?? 'Job', provider_name:q.provider_profiles?.display_name ?? 'Provider'}));
  },
  async acceptQuote(quoteId: string) {
    const { error } = await supabase.rpc('accept_quotation', { p_quote_id: quoteId });
    if (error) throw error;
  },
  async bookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase.from('bookings').select('id,job_id,customer_id,provider_id,quote_id,agreed_amount,status,job_requests(title),provider_profiles(display_name)').or(`customer_id.eq.${userId},provider_id.eq.${userId}`).order('created_at',{ascending:false});
    if (error) throw error;
    return (data ?? []).map((b: any) => ({...b, job_title:b.job_requests?.title ?? 'Booking', provider_name:b.provider_profiles?.display_name ?? 'Provider'}));
  },
  async updateBooking(bookingId: string, status: string) {
    const { error } = await supabase.from('bookings').update({status}).eq('id',bookingId);
    if (error) throw error;
  }
};
