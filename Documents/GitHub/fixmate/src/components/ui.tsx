import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { ThemePalette } from '../theme';

export function Button({title,onPress,palette,disabled=false,secondary=false}: {title:string;onPress:()=>void;palette:ThemePalette;disabled?:boolean;secondary?:boolean}) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.button,{backgroundColor:secondary?palette.panel2:palette.primary,borderColor:palette.border,opacity:disabled ? 0.55 : 1}]}><Text style={{color:secondary?palette.text:palette.primaryText,fontWeight:'700'}}>{title}</Text></Pressable>;
}
export function Field({label,value,onChangeText,palette,multiline=false,keyboardType}: {label:string;value:string;onChangeText:(v:string)=>void;palette:ThemePalette;multiline?:boolean;keyboardType?:'default'|'email-address'|'numeric'|'phone-pad'}) {
  return <View style={{gap:6,marginBottom:12}}><Text style={{color:palette.muted,fontSize:13}}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={label} placeholderTextColor={palette.muted} keyboardType={keyboardType} multiline={multiline} style={[styles.input,{backgroundColor:palette.inputBg,color:palette.inputText,borderColor:palette.border,minHeight:multiline?90:48,textAlignVertical:multiline?'top':'center'}]} /></View>;
}
export function Card({children,palette}: {children:React.ReactNode;palette:ThemePalette}) { return <View style={[styles.card,{backgroundColor:palette.panel,borderColor:palette.border}]}>{children}</View>; }
export function Loading({palette}: {palette:ThemePalette}) { return <ActivityIndicator color={palette.primary} style={{margin:24}} />; }
export const styles = StyleSheet.create({button:{minHeight:46,borderRadius:12,alignItems:'center',justifyContent:'center',paddingHorizontal:16,borderWidth:1,marginVertical:5},input:{borderWidth:1,borderRadius:11,paddingHorizontal:13,paddingVertical:11,fontSize:15},card:{borderWidth:1,borderRadius:15,padding:15,marginBottom:12,gap:8}});
