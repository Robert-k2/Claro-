import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { PEOPLE, TODAY } from './src/data';
import { api, MODE } from './src/api';
import { C, shadow } from './src/ui';
import { CaseScreen, BookScreen, MineScreen, SlotsScreen, ReviewScreen, CasesScreen } from './src/screens';

const TABS = {
  client: [['case', 'My case', 'document-text'], ['book', 'Book', 'calendar'], ['mine', 'Bookings', 'bookmark']],
  consultant: [['slots', 'My slots', 'time'], ['review', 'Documents', 'checkmark-done']],
  admin: [['cases', 'All cases', 'people']],
};
const SUBTITLE = { client: 'Your Czech study visa', consultant: 'Visa consultant', admin: 'Administrator' };

function Shell() {
  const insets = useSafeAreaInsets();
  const [S, setS] = useState(null);
  const [err, setErr] = useState('');
  const [who, setWho] = useState('camila');
  const [tab, setTab] = useState('case');
  const [toast, setToast] = useState(null);
  const [pulling, setPulling] = useState(false);
  const role = PEOPLE[who].role;

  const say = (m, bad) => { setToast({ m, bad }); setTimeout(() => setToast(null), 2000); };
  const refresh = async () => { try { setS(await api.state()); setErr(''); } catch (e) { setErr(e.message); } };
  useEffect(() => { refresh(); }, []);

  const run = async (fn, ok) => {
    try { await fn(); if (ok) say(ok); } catch (e) { say(e.message, true); }
    await refresh();
    return true;
  };

  const a = {
    book: (id) => run(() => api.book(id, who), 'Consultation booked'),
    cancel: (id) => run(() => api.cancel(id, who), 'Booking cancelled'),
    upload: async (c, i) => {
      const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
      if (r.canceled || !r.assets?.length) return;
      const file = r.assets[0].name; 
      await run(() => api.upload(c, i, file), 'Uploaded ' + file);
    },
    review: (c, i, ok, note) => {
      if (!ok && !note?.trim()) return say('Add a correction note first', true);
      return run(() => api.review(c, i, ok, note), ok ? 'Document approved' : 'Sent back for correction');
    },
    addSlot: async (c, date, time) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { say('Use YYYY-MM-DD and HH:MM', true); return false; }
      if (date < TODAY) { say('That date is in the past', true); return false; }
      try { await api.addSlot(c, date, time); say('Slot created'); await refresh(); return true; }
      catch (e) { say(e.message, true); return false; }
    },
    delSlot: (id) => run(() => api.delSlot(id), 'Slot removed'),
    setStatus: (c, s) => run(() => api.setStatus(c, s), 'Case set to ' + s),
  };

  if (!S) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        {err ? (
          <>
            <Ionicons name="cloud-offline" size={44} color={C.mut} />
            <Text style={{ color: C.ink, fontSize: 18, fontWeight: '800', marginTop: 10 }}>Cannot reach the server</Text>
            <Text style={{ color: C.sub, textAlign: 'center', marginVertical: 8 }}>{err}. Check that the API is running and EXPO_PUBLIC_API_URL is correct.</Text>
            <Pressable onPress={refresh}><Text style={{ color: C.brand, fontWeight: '800', fontSize: 16 }}>Try again</Text></Pressable>
          </>
        ) : <ActivityIndicator color={C.brand} size="large" />}
      </View>
    );
  }

  const switchWho = (k) => { setWho(k); setTab(TABS[PEOPLE[k].role][0][0]); };
  const screens = {
    case: <CaseScreen S={S} who={who} a={a} />, book: <BookScreen S={S} a={a} />, mine: <MineScreen S={S} who={who} a={a} />,
    slots: <SlotsScreen S={S} who={who} a={a} />, review: <ReviewScreen S={S} a={a} />, cases: <CasesScreen S={S} a={a} />,
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <View style={{ backgroundColor: C.brandDark, paddingTop: insets.top + 10, paddingHorizontal: 18, paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="shield-checkmark" size={22} color="#5EEAD4" />
            <Text style={{ color: C.white, fontSize: 18, fontWeight: '800' }}>Claro Visa Portal</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
            <Text style={{ color: '#CCFBF1', fontSize: 11, fontWeight: '800' }}>{MODE.toUpperCase()} MODE</Text>
          </View>
        </View>
        <Text style={{ color: C.white, fontSize: 24, fontWeight: '800', marginTop: 16 }}>Hello, {PEOPLE[who].short}</Text>
        <Text style={{ color: '#99F6E4', marginTop: 2 }}>{SUBTITLE[role]}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
          {Object.entries(PEOPLE).map(([k, p]) => {
            const on = k === who;
            return (
              <Pressable key={k} onPress={() => switchWho(k)} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, marginRight: 8, backgroundColor: on ? C.white : 'rgba(255,255,255,0.12)' }}>
                <Text style={{ color: on ? C.brandDark : '#CCFBF1', fontWeight: '700', fontSize: 13 }}>{p.short} · {p.role}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 30 }} keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={pulling} onRefresh={async () => { setPulling(true); await refresh(); setPulling(false); }} tintColor={C.brand} />}>
        {screens[tab]}
      </ScrollView>

      {!!toast && (
        <View style={{ position: 'absolute', bottom: 96 + insets.bottom, alignSelf: 'center', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: toast.bad ? C.bad : C.ink, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 11, ...shadow }}>
          <Ionicons name={toast.bad ? 'alert-circle' : 'checkmark-circle'} size={18} color={C.white} />
          <Text style={{ color: C.white, fontWeight: '600' }}>{toast.m}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', backgroundColor: C.white, paddingBottom: insets.bottom, paddingTop: 6, borderTopWidth: 1, borderColor: C.line }}>
        {TABS[role].map(([k, label, icon]) => {
          const on = k === tab;
          return (
            <Pressable key={k} onPress={() => setTab(k)} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
              <View style={{ backgroundColor: on ? C.brandSoft : 'transparent', paddingHorizontal: 18, paddingVertical: 4, borderRadius: 99 }}>
                <Ionicons name={on ? icon : icon + '-outline'} size={22} color={on ? C.brand : C.mut} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: on ? C.brand : C.mut, marginTop: 2 }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><Shell /></SafeAreaProvider>;
}




