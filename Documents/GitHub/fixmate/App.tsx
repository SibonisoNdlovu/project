import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { AuthScreen } from './src/screens/AuthScreen';
import { BookingsScreen, BrowseScreen, JobsScreen, MyQuotesScreen, ProfileScreen } from './src/screens/MarketplaceScreens';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import { themes, type ThemeMode } from './src/theme';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from './src/types';

const tabs = [
  {id:'browse',label:'Find',icon:'⌕'}, {id:'jobs',label:'Jobs',icon:'＋'},
  {id:'quotes',label:'Quotes',icon:'▤'}, {id:'bookings',label:'Bookings',icon:'✓'}, {id:'profile',label:'Profile',icon:'◉'}
] as const;
type Tab = typeof tabs[number]['id'];

export default function App() {
 const [session,setSession]=useState<Session|null>(null);const [profile,setProfile]=useState<Profile|null>(null);const [loading,setLoading]=useState(true);const [tab,setTab]=useState<Tab>('browse');const [themeMode,setThemeMode]=useState<ThemeMode>('dark');const [role,setRole]=useState<'customer'|'provider'|'both'>('both');
 const palette=themes[themeMode];
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session)).catch(()=>{}).finally(()=>setLoading(false));const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);if(!next)setProfile(null);});return()=>subscription.unsubscribe();},[]);
 useEffect(()=>{if(!session?.user)return;let active=true;supabase.from('profiles').select('id,full_name,phone,suburb,account_role,is_admin').eq('id',session.user.id).maybeSingle().then(({data,error})=>{if(!active)return;if(error){Alert.alert('Profile unavailable',error.message);return;}if(data){setProfile(data as Profile);setRole(data.account_role==='customer'||data.account_role==='provider'?data.account_role:'both');}else{setProfile({id:session.user.id,full_name:session.user.user_metadata?.full_name??'',phone:null,suburb:null,account_role:'both',is_admin:false});}});return()=>{active=false;};},[session?.user.id]);
 const changeRole=async(next:'customer'|'provider'|'both')=>{setRole(next);const {error}=await supabase.from('profiles').update({account_role:next}).eq('id',session?.user.id);if(error)Alert.alert('Could not update account mode',error.message);};
 const signOut=async()=>{const {error}=await supabase.auth.signOut();if(error)Alert.alert('Could not sign out',error.message);};
 if(!isSupabaseConfigured)return <SafeAreaView style={{flex:1,backgroundColor:palette.bg,justifyContent:'center',padding:24}}><StatusBar barStyle={themeMode==='dark'?'light-content':'dark-content'}/><Text style={{fontSize:30,fontWeight:'900',color:palette.text,marginBottom:10}}>Fix<Text style={{color:palette.primary}}>Mate</Text></Text><Text style={{color:palette.muted,lineHeight:23}}>Connect your Supabase project to get started. Copy .env.example to .env, add your project URL and anon/publishable key, then restart Expo.</Text></SafeAreaView>;
 if(loading)return <SafeAreaView style={{flex:1,backgroundColor:palette.bg,justifyContent:'center',alignItems:'center'}}><Text style={{color:palette.text}}>Loading FixMate…</Text></SafeAreaView>;
 if(!session)return <SafeAreaView style={{flex:1,backgroundColor:palette.bg}}><StatusBar barStyle={themeMode==='dark'?'light-content':'dark-content'}/><AuthScreen palette={palette}/></SafeAreaView>;
 const content=()=>{switch(tab){case'browse':return <BrowseScreen palette={palette}/>;case'jobs':return <JobsScreen palette={palette} userId={session.user.id} role={role}/>;case'quotes':return <MyQuotesScreen palette={palette} userId={session.user.id} role={role}/>;case'bookings':return <BookingsScreen palette={palette} userId={session.user.id}/>;case'profile':return <ProfileScreen palette={palette} userId={session.user.id} onSignOut={signOut} onTheme={()=>setThemeMode(themeMode==='dark'?'light':'dark')} theme={themeMode} role={role} onRole={changeRole}/>;}};
 return <SafeAreaView style={{flex:1,backgroundColor:palette.bg}}><StatusBar barStyle={themeMode==='dark'?'light-content':'dark-content'}/><View style={{paddingHorizontal:18,paddingTop:8,paddingBottom:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Text style={{fontSize:25,fontWeight:'900',color:palette.text}}>Fix<Text style={{color:palette.primary}}>Mate</Text></Text><Text style={{fontSize:12,color:palette.muted}}>{profile?.full_name||session.user.email}</Text></View><View style={{flex:1}}>{content()}</View><View style={{flexDirection:'row',borderTopWidth:1,borderTopColor:palette.border,backgroundColor:palette.panel,paddingVertical:7}}>{tabs.map(t=><Pressable key={t.id} onPress={()=>setTab(t.id)} style={{flex:1,alignItems:'center',gap:2,paddingVertical:5}}><Text style={{fontSize:19,color:tab===t.id?palette.primary:palette.muted}}>{t.icon}</Text><Text style={{fontSize:10,fontWeight:tab===t.id?'800':'500',color:tab===t.id?palette.primary:palette.muted}}>{t.label}</Text></Pressable>)}</View></SafeAreaView>;
}
