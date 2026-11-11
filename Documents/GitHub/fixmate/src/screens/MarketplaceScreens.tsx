import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Button, Card, Field, Loading } from '../components/ui';
import { marketplace } from '../services/marketplace';
import type { Booking, Category, Job, Provider, Quote } from '../types';
import type { ThemePalette } from '../theme';

const Heading=({children,palette}:{children:string;palette:ThemePalette})=><Text style={{fontSize:22,fontWeight:'800',color:palette.text,marginBottom:12}}>{children}</Text>;
const Body=({children,palette}:{children:string;palette:ThemePalette})=><Text style={{color:palette.muted,lineHeight:21}}>{children}</Text>;

export function BrowseScreen({palette}:{palette:ThemePalette}) {
 const [providers,setProviders]=useState<Provider[]>([]);const [loading,setLoading]=useState(true);
 useEffect(()=>{marketplace.providers().then(setProviders).catch(e=>Alert.alert('Could not load providers',e.message)).finally(()=>setLoading(false));},[]);
 return <ScrollView contentContainerStyle={{padding:16}}><Heading palette={palette}>Find a provider</Heading><Body palette={palette}>Browse individuals and registered businesses offering services in your area.</Body><View style={{height:14}}/>{loading?<Loading palette={palette}/>:providers.length===0?<Body palette={palette}>No providers have joined yet. Provider profiles will appear here when they register.</Body>:providers.map(p=><Card key={p.user_id} palette={palette}><Text style={{fontSize:17,fontWeight:'800',color:palette.text}}>{p.display_name}</Text><Text style={{color:palette.primary}}>{p.provider_type==='business'?'Registered business':'Independent provider'}{p.is_verified?' · Verified':''}</Text><Body palette={palette}>{p.description||'No description added yet.'}</Body><Body palette={palette}>Service areas: {p.service_suburbs?.join(', ')||'Not specified'}</Body></Card>)}</ScrollView>;
}

export function JobsScreen({palette,userId,role}:{palette:ThemePalette;userId:string;role:'customer'|'provider'|'both'}) {
 const [jobs,setJobs]=useState<Job[]>([]);
 const [categories,setCategories]=useState<Category[]>([]);
 const [loading,setLoading]=useState(true);
 const [title,setTitle]=useState('');
 const [description,setDescription]=useState('');
 const [suburb,setSuburb]=useState('Goodwood');
 const [categoryId,setCategoryId]=useState('');
 const [selected,setSelected]=useState<Job|null>(null);
 const [amount,setAmount]=useState('');
 const [message,setMessage]=useState('');
 const [myQuotes,setMyQuotes]=useState<Quote[]>([]);
 const load=async()=>{
  try {
   const [j,c,q]=await Promise.all([marketplace.jobs(),marketplace.categories(),marketplace.myQuotes(userId)]);
   setJobs(j);setCategories(c);setMyQuotes(q);
   if(!categoryId&&c[0])setCategoryId(c[0].id);
  } catch(e) { Alert.alert('Could not load jobs',e instanceof Error?e.message:'Try again.'); }
  finally { setLoading(false); }
 };
 useEffect(()=>{load();},[]);
 const create=async()=>{
  if(!title.trim()||!description.trim()||!suburb.trim()||!categoryId) return Alert.alert('Missing details','Complete the job title, description, suburb and category.');
  try {
   await marketplace.createJob({customer_id:userId,category_id:categoryId,title:title.trim(),description:description.trim(),suburb:suburb.trim()});
   setTitle('');setDescription('');Alert.alert('Request published','Providers can now submit quotations.');load();
  } catch(e) { Alert.alert('Could not publish',e instanceof Error?e.message:'Try again.'); }
 };
 const quote=async()=>{
  const value=Number(amount);
  if(!selected||!Number.isFinite(value)||value<=0||!message.trim()) return Alert.alert('Check quotation','Enter a valid amount and a short message.');
  try {
   await marketplace.submitQuote({job_id:selected.id,provider_id:userId,amount:value,message:message.trim()});
   setSelected(null);setAmount('');setMessage('');Alert.alert('Quotation sent','The customer can now review your quote.');load();
  } catch(e) { Alert.alert('Could not send quote',e instanceof Error?e.message:'Try again.'); }
 };
 return (
  <ScrollView contentContainerStyle={{padding:16}}>
   <Heading palette={palette}>{role==='customer'?'Post a job':'Available jobs'}</Heading>
   {role!=='provider' && (
    <Card palette={palette}>
     <Text style={{color:palette.text,fontWeight:'800'}}>Create a job request</Text>
     <Field label="What do you need done?" value={title} onChangeText={setTitle} palette={palette}/>
     <Field label="Describe the work" value={description} onChangeText={setDescription} palette={palette} multiline/>
     <Field label="Suburb" value={suburb} onChangeText={setSuburb} palette={palette}/>
     <Text style={{color:palette.muted,fontSize:12}}>Category: {categories.find(c=>c.id===categoryId)?.name??'Loading categories'}</Text>
     <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
      {categories.map(c=><Button key={c.id} title={c.name} onPress={()=>setCategoryId(c.id)} palette={palette} secondary={categoryId!==c.id}/>) }
     </View>
     <Button title="Publish job request" onPress={create} palette={palette}/>
    </Card>
   )}
   {role!=='customer' && (
    <>
     <Heading palette={palette}>Open requests</Heading>
     {loading ? <Loading palette={palette}/> : jobs.length===0 ? <Body palette={palette}>No open requests right now.</Body> : jobs.map(j=>(
      <Card key={j.id} palette={palette}>
       <Text style={{color:palette.text,fontWeight:'800',fontSize:16}}>{j.title}</Text>
       <Text style={{color:palette.primary}}>{j.category_name} · {j.suburb}</Text>
       <Body palette={palette}>{j.description}</Body>
       <Button title={selected?.id===j.id?'Close quotation form':'Prepare a quotation'} onPress={()=>setSelected(selected?.id===j.id?null:j)} palette={palette} secondary/>
       <Text style={{color:palette.muted,fontSize:12}}>{myQuotes.some(q=>q.job_id===j.id)?'You have already quoted on this request.':' '}</Text>
       {selected?.id===j.id && (
        <View>
         <Field label="Quote amount (ZAR)" value={amount} onChangeText={setAmount} palette={palette} keyboardType="numeric"/>
         <Field label="Message / scope of work" value={message} onChangeText={setMessage} palette={palette} multiline/>
         <Button title="Send quotation" onPress={quote} palette={palette}/>
        </View>
       )}
      </Card>
     ))}
    </>
   )}
  </ScrollView>
 );
}

export function MyQuotesScreen({palette,userId,role}:{palette:ThemePalette;userId:string;role:'customer'|'provider'|'both'}) {
 const [quotes,setQuotes]=useState<Quote[]>([]);const [loading,setLoading]=useState(true);
 const load=()=>Promise.all([role!=='customer'?marketplace.myQuotes(userId):Promise.resolve([]),role!=='provider'?marketplace.customerQuotes(userId):Promise.resolve([])]).then(([sent,received])=>setQuotes([...sent,...received])).catch(e=>Alert.alert('Could not load quotations',e.message)).finally(()=>setLoading(false));
 useEffect(()=>{load();},[role]);
 const accept=async(id:string)=>{try{await marketplace.acceptQuote(id);Alert.alert('Quotation accepted','A booking has been created. Other quotations on this job were declined.');load();}catch(e){Alert.alert('Could not accept quotation',e instanceof Error?e.message:'Try again.');}};
 return <ScrollView contentContainerStyle={{padding:16}}><Heading palette={palette}>Quotations</Heading>{loading?<Loading palette={palette}/>:quotes.length===0?<Body palette={palette}>Quotations you send or receive will appear here.</Body>:quotes.map(q=><Card key={q.id} palette={palette}><Text style={{fontWeight:'800',color:palette.text}}>{q.job_title??'Job request'}</Text><Text style={{color:palette.primary}}>R {Number(q.amount).toLocaleString('en-ZA')} · {q.status}</Text><Body palette={palette}>{q.provider_name?`From ${q.provider_name}. `:''}{q.message}</Body>{q.status==='pending'&&role!=='provider'&&<Button title="Accept quotation" onPress={()=>accept(q.id)} palette={palette}/>}</Card>)}</ScrollView>;
}

export function BookingsScreen({palette,userId}:{palette:ThemePalette;userId:string}) {
 const [bookings,setBookings]=useState<Booking[]>([]);const [loading,setLoading]=useState(true);const load=()=>marketplace.bookings(userId).then(setBookings).catch(e=>Alert.alert('Could not load bookings',e.message)).finally(()=>setLoading(false));useEffect(()=>{load();},[]);
 const update=async(id:string,status:string)=>{try{await marketplace.updateBooking(id,status);load();}catch(e){Alert.alert('Update failed',e instanceof Error?e.message:'Try again.');}};
 return <ScrollView contentContainerStyle={{padding:16}}><Heading palette={palette}>Bookings</Heading>{loading?<Loading palette={palette}/>:bookings.length===0?<Body palette={palette}>Accepted quotations become bookings and will appear here.</Body>:bookings.map(b=><Card key={b.id} palette={palette}><Text style={{fontWeight:'800',color:palette.text}}>{b.job_title}</Text><Text style={{color:palette.primary}}>R {Number(b.agreed_amount).toLocaleString('en-ZA')} · {b.status.replaceAll('_',' ')}</Text>{b.status==='confirmed'&&<Button title="Mark as in progress" onPress={()=>update(b.id,'in_progress')} palette={palette} secondary/>}{b.status==='in_progress'&&<Button title="Mark as completed" onPress={()=>update(b.id,'completed')} palette={palette}/>}</Card>)}</ScrollView>;
}

export function ProfileScreen({palette,userId,onSignOut,onTheme,theme,role,onRole}:{palette:ThemePalette;userId:string;onSignOut:()=>void;onTheme:()=>void;theme:string;role:'customer'|'provider'|'both';onRole:(v:'customer'|'provider'|'both')=>void}) {
 const [type,setType]=useState<'individual'|'business'>('individual');const [display,setDisplay]=useState('');const [description,setDescription]=useState('');const [areas,setAreas]=useState('Goodwood, Bellville, Cape Town CBD');const [saving,setSaving]=useState(false);
 const save=async()=>{if(!display.trim())return Alert.alert('Add a name','Enter your provider or business name.');setSaving(true);try{await marketplace.createProvider({user_id:userId,provider_type:type,display_name:display.trim(),description:description.trim(),service_suburbs:areas.split(',').map(s=>s.trim()).filter(Boolean)});Alert.alert('Provider profile saved','Your profile is now visible in provider search.');}catch(e){Alert.alert('Could not save profile',e instanceof Error?e.message:'Try again.');}finally{setSaving(false);}};
 return <ScrollView contentContainerStyle={{padding:16}}><Heading palette={palette}>Your account</Heading><Card palette={palette}><Body palette={palette}>Account ID</Body><Text selectable style={{color:palette.text,fontSize:12}}>{userId}</Text><Text style={{color:palette.text,fontWeight:'800'}}>Account mode</Text><View style={{flexDirection:'row',gap:6,flexWrap:'wrap'}}>{(['customer','provider','both'] as const).map(v=><Button key={v} title={v[0].toUpperCase()+v.slice(1)} onPress={()=>onRole(v)} palette={palette} secondary={role!==v}/>)}</View><Button title={`Switch to ${theme==='dark'?'light':'dark'} theme`} onPress={onTheme} palette={palette} secondary/></Card><Heading palette={palette}>Become a provider</Heading><Card palette={palette}><Text style={{color:palette.text,fontWeight:'800'}}>Provider type: {type}</Text><View style={{flexDirection:'row',gap:8}}><Button title="Individual" onPress={()=>setType('individual')} palette={palette} secondary={type!=='individual'}/><Button title="Business" onPress={()=>setType('business')} palette={palette} secondary={type!=='business'}/></View><Field label="Display name / business name" value={display} onChangeText={setDisplay} palette={palette}/><Field label="About your services" value={description} onChangeText={setDescription} palette={palette} multiline/><Field label="Service suburbs (comma separated)" value={areas} onChangeText={setAreas} palette={palette}/><Button title={saving?'Saving…':'Save provider profile'} onPress={save} palette={palette} disabled={saving}/></Card><Button title="Sign out" onPress={onSignOut} palette={palette} secondary/></ScrollView>;
}
