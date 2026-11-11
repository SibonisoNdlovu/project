import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import type { ThemePalette } from '../theme';
import { Button, Field } from '../components/ui';

export function AuthScreen({palette}: {palette:ThemePalette}) {
  const [signup,setSignup]=useState(false); const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false);
  const submit=async()=>{ if(!email.trim()||!password.trim()||(signup&&!name.trim())) return Alert.alert('Missing details','Complete all required fields.'); if(password.length<6) return Alert.alert('Password too short','Use at least 6 characters.'); setBusy(true);
    try { if(signup){ const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()}}}); if(error) throw error; if(!data.session) Alert.alert('Check your email','Confirm your email address, then sign in.'); } else { const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password}); if(error) throw error; } }
    catch(e){Alert.alert('Authentication failed',e instanceof Error?e.message:'Please try again.');} finally{setBusy(false);} };
  return <View style={{flex:1,justifyContent:'center',padding:24,gap:10}}><Text style={{fontSize:34,fontWeight:'900',color:palette.text}}>Fix<Text style={{color:palette.primary}}>Mate</Text></Text><Text style={{color:palette.muted,marginBottom:20}}>Find trusted local help. Get the job done.</Text>{signup&&<Field label="Full name" value={name} onChangeText={setName} palette={palette}/>}<Field label="Email address" value={email} onChangeText={setEmail} palette={palette} keyboardType="email-address"/><Field label="Password" value={password} onChangeText={setPassword} palette={palette}/><Button title={busy?'Please wait…':signup?'Create account':'Sign in'} onPress={submit} palette={palette} disabled={busy}/><Button title={signup?'I already have an account':'Create a new account'} onPress={()=>setSignup(!signup)} palette={palette} secondary/></View>;
}
