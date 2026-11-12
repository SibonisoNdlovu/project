
import { supabase } from '../lib/supabase';
import type { Booking, Category, Job, Provider, Quote } from '../types';

export type ProviderProfile = {
  user_id: string;
  provider_type: 'individual' | 'business';
  display_name: string;
  description: string | null;
  service_suburbs: string[];
  is_verified: boolean;
};

export const marketplace = {
  async categories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('id,name,icon')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data ?? [];
  },


async providers(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('provider_profiles')
    .select(
      'user_id,provider_type,display_name,description,service_suburbs,is_verified'
    )
    .not('description', 'is', null)
    .neq('description', '')
    .not('display_name', 'is', null)
    .neq('display_name', '')
    .order('display_name');

  if (error) throw error;

  const profiles = (data ?? []).filter(
    provider => provider.service_suburbs?.length > 0
  );

  if (!profiles.length) return [];

  const providerIds = profiles.map(provider => provider.user_id);

  const { data: services, error: servicesError } = await supabase
    .from('provider_services')
    .select('provider_id,service_categories(name)')
    .in('provider_id', providerIds);

  if (servicesError) throw servicesError;

  const categoryMap = new Map<string, string[]>();

  for (const service of services ?? []) {
    const category = service.service_categories as unknown as
      { name: string } | null;

    if (!category?.name) continue;

    const existing = categoryMap.get(service.provider_id) ?? [];

    if (!existing.includes(category.name)) {
      existing.push(category.name);
    }

    categoryMap.set(service.provider_id, existing);
  }

  return profiles.map(provider => ({
    ...provider,
    category_names: categoryMap.get(provider.user_id) ?? [],
  }));
},


  async providerProfile(userId: string): Promise<ProviderProfile | null> {
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('user_id,provider_type,display_name,description,service_suburbs,is_verified')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async providerCategoryIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('provider_services')
      .select('category_id')
      .eq('provider_id', userId);

    if (error) throw error;
    return (data ?? []).map(item => item.category_id);
  },

  async saveProvider(input: {
    provider_type: 'individual' | 'business';
    display_name: string;
    description: string;
    service_suburbs: string[];
    category_ids: string[];
  }): Promise<void> {
    const { error } = await supabase.rpc('save_provider_profile', {
      p_provider_type: input.provider_type,
      p_display_name: input.display_name,
      p_description: input.description,
      p_service_suburbs: input.service_suburbs,
      p_category_ids: input.category_ids,
    });

    if (error) throw error;
  },

  async jobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('job_requests')
      .select('id,customer_id,title,description,suburb,status,created_at,category_id,service_categories(name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((item: any) => ({
      ...item,
      category_name: item.service_categories?.name ?? 'Service',
    }));
  },

  async myJobs(userId: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('job_requests')
      .select('id,customer_id,title,description,suburb,status,created_at,category_id')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async createJob(input: {
    customer_id: string;
    category_id: string;
    title: string;
    description: string;
    suburb: string;
  }) {
    const { error } = await supabase
      .from('job_requests')
      .insert({ ...input, status: 'open' });

    if (error) throw error;
  },


  async requestQuote(input: {
    provider_id: string;
    category_id: string;
    title: string;
    description: string;
    suburb: string;
  }): Promise<string> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('Please sign in to request a quote.');

    // Create the customer's job request.
    const { data: job, error: jobError } = await supabase
      .from('job_requests')
      .insert({
        customer_id: user.id,
        category_id: input.category_id,
        title: input.title,
        description: input.description,
        suburb: input.suburb,
        status: 'open',
      })
      .select('id')
      .single();

    if (jobError) throw jobError;

    // Create a direct conversation with the selected provider.
    const { data: conversation, error: conversationError } =
      await supabase
        .from('conversations')
        .insert({
          job_id: null,
          customer_id: user.id,
          provider_id: input.provider_id,
        })
        .select('id')
        .single();

    if (conversationError) {
      throw new Error(
        `Your request was created, but the conversation could not be started: ${conversationError.message}`,
      );
    }

    // Send the provider the initial request details.
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        body: [
          'New quote request',
          `Request reference: ${job.id}`,
          `Service: ${input.title}`,
          `Suburb: ${input.suburb}`,
          '',
          input.description,
        ].join('\n'),
      });

    if (messageError) {
      throw new Error(
        `Your request and conversation were created, but the introductory message could not be sent: ${messageError.message}`,
      );
    }

    return job.id;
  },


  async submitQuote(input: {
    job_id: string;
    provider_id: string;
    amount: number;
    message: string;
  }) {
    const { error } = await supabase
      .from('quotations')
      .insert({ ...input, status: 'pending' });

    if (error) throw error;
  },

  async quotesForJob(jobId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotations')
      .select('id,job_id,provider_id,amount,message,status,created_at,provider_profiles(display_name)')
      .eq('job_id', jobId)
      .order('created_at');

    if (error) throw error;

    return (data ?? []).map((q: any) => ({
      ...q,
      provider_name: q.provider_profiles?.display_name ?? 'Provider',
    }));
  },

  async myQuotes(userId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotations')
      .select('id,job_id,provider_id,amount,message,status,created_at,job_requests(title)')
      .eq('provider_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((q: any) => ({
      ...q,
      job_title: q.job_requests?.title ?? 'Job',
    }));
  },

  async customerQuotes(userId: string): Promise<Quote[]> {
    const { data: jobs, error: jobsError } = await supabase
      .from('job_requests')
      .select('id,title')
      .eq('customer_id', userId);

    if (jobsError) throw jobsError;
    if (!jobs?.length) return [];

    const jobIds = jobs.map(job => job.id);

    const { data, error } = await supabase
      .from('quotations')
      .select('id,job_id,provider_id,amount,message,status,created_at,provider_profiles(display_name)')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const titles = new Map(jobs.map(job => [job.id, job.title]));

    return (data ?? []).map((q: any) => ({
      ...q,
      job_title: titles.get(q.job_id) ?? 'Job',
      provider_name: q.provider_profiles?.display_name ?? 'Provider',
    }));
  },

  async acceptQuote(quoteId: string) {
    const { error } = await supabase.rpc('accept_quotation', {
      p_quote_id: quoteId,
    });

    if (error) throw error;
  },

  async bookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('id,job_id,customer_id,provider_id,quote_id,agreed_amount,status,job_requests(title),provider_profiles(display_name)')
      .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((b: any) => ({
      ...b,
      job_title: b.job_requests?.title ?? 'Booking',
      provider_name: b.provider_profiles?.display_name ?? 'Provider',
    }));
  },

  async updateBooking(bookingId: string, status: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) throw error;
  },
};
