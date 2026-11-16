import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { PEOPLE, TODAY } from './src/data';
import { api, MODE, logout, setUnauthorizedHandler } from './src/api';
import { C, shadow } from './src/ui';
import {
  CaseScreen, BookScreen, MineScreen, SlotsScreen, ReviewScreen, CasesScreen,
} from './src/screens';

// Tabs available for each role
const TABS = {
  client: [['case', 'My case', 'document-text'], ['book', 'Book', 'calendar'], ['mine', 'Bookings', 'bookmark']],
  consultant: [['slots', 'My slots', 'time'], ['review', 'Documents', 'checkmark-done']],
  admin: [['cases', 'All cases', 'people']],
};
const SUBTITLE = { client: 'Your Czech study visa', consultant: 'Visa consultant', admin: 'Administrator' };

const inputStyle = {
  height: 52,
  borderWidth: 1,
  borderColor: C.line,
  borderRadius: 10,
  backgroundColor: C.white,
  paddingHorizontal: 16,
  fontSize: 16,
  color: C.ink,
};
const labelStyle = { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 6 };
const buttonStyle = {
  height: 52,
  borderRadius: 10,
  backgroundColor: C.brand,
  alignItems: 'center',
  justifyContent: 'center',
};

// ---------- Login ----------
function LoginScreen({ onLoggedIn }) {
  const insets = useSafeAreaInsets();
  const [staff, setStaff] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim() || !password) {
      setError('Enter your name and password');
      return;
    }
    setBusy(true);
    setError('');
    try {
      // The client screen only accepts clients. The staff screen accepts consultants and admins.
      const user = await api.login(name.trim(), password, staff ? null : 'client');
      if (staff && user.role === 'client') {
        logout();
        setError('Clients log in on the client screen');
        setBusy(false);
        return;
      }
      onLoggedIn(user);
    } catch (e) {
      setError(e.isNetwork ? 'Cannot reach the server. Check your connection.' : e.message);
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, padding: 28, paddingTop: insets.top + 56 }}
      >
        <View style={{
          width: 48, height: 48, borderRadius: 12, backgroundColor: C.brand,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="shield-checkmark" size={26} color={C.white} />
        </View>
        <Text style={{ fontSize: 30, fontWeight: '800', color: C.ink, marginTop: 16 }}>
          Claro Visa Portal
        </Text>
        <Text style={{ fontSize: 16, color: C.sub, marginTop: 6, marginBottom: 36 }}>
          {staff
            ? 'Log in to manage visa cases and documents.'
            : 'Log in to follow your visa case and upload documents.'}
        </Text>

        <Text style={labelStyle}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          style={inputStyle}
        />

        <Text style={[labelStyle, { marginTop: 20 }]}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          onSubmitEditing={submit}
          style={inputStyle}
        />

        {!!error && (
          <Text style={{ color: C.bad, marginTop: 14, fontWeight: '600' }}>{error}</Text>
        )}

        <Pressable onPress={submit} disabled={busy} style={[buttonStyle, { marginTop: 24 }]}>
          {busy
            ? <ActivityIndicator color={C.white} />
            : (
              <Text style={{ color: C.white, fontSize: 16, fontWeight: '800' }}>
                {staff ? 'Log in' : 'Log in as a client'}
              </Text>
            )}
        </Pressable>

        <Pressable
          onPress={() => { setStaff(!staff); setError(''); }}
          style={{ alignSelf: 'center', paddingVertical: 16 }}
        >
          <Text style={{ color: C.brand, fontWeight: '700' }}>
            {staff ? 'Are you a client? Log in here' : 'Are you a consultant? Log in here'}
          </Text>
        </Pressable>

        <Text style={{ color: C.sub, textAlign: 'center', marginTop: 'auto', paddingTop: 24 }}>
          Need an account? Your consultant will send you an invitation.
        </Text>
      </ScrollView>
    </View>
  );
}

// ---------- First login: choose a new password ----------
function ChangePasswordScreen({ onDone, onLogout }) {
  const insets = useSafeAreaInsets();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (newPw.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (newPw !== again) { setError('The new passwords do not match'); return; }
    setBusy(true);
    setError('');
    try {
      await api.changePassword(oldPw, newPw);
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, padding: 28, paddingTop: insets.top + 56 }}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: C.ink }}>Choose a new password</Text>
        <Text style={{ fontSize: 16, color: C.sub, marginTop: 6, marginBottom: 28 }}>
          You are using a temporary password. Set your own to continue.
        </Text>

        <Text style={labelStyle}>Temporary password</Text>
        <TextInput value={oldPw} onChangeText={setOldPw} secureTextEntry autoCapitalize="none" style={inputStyle} />

        <Text style={[labelStyle, { marginTop: 20 }]}>New password</Text>
        <TextInput value={newPw} onChangeText={setNewPw} secureTextEntry autoCapitalize="none" style={inputStyle} />

        <Text style={[labelStyle, { marginTop: 20 }]}>Repeat new password</Text>
        <TextInput value={again} onChangeText={setAgain} secureTextEntry autoCapitalize="none" style={inputStyle} />

        {!!error && (
          <Text style={{ color: C.bad, marginTop: 14, fontWeight: '600' }}>{error}</Text>
        )}

        <Pressable onPress={submit} disabled={busy} style={[buttonStyle, { marginTop: 24 }]}>
          {busy
            ? <ActivityIndicator color={C.white} />
            : <Text style={{ color: C.white, fontSize: 16, fontWeight: '800' }}>Save password</Text>}
        </Pressable>
        <Pressable onPress={onLogout} style={{ alignSelf: 'center', paddingVertical: 16 }}>
          <Text style={{ color: C.brand, fontWeight: '700' }}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------- Main app ----------
function Shell() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [who, setWho] = useState(null);
  const [S, setS] = useState(null);
  const [err, setErr] = useState('');
  const [netErr, setNetErr] = useState(false);
  const [tab, setTab] = useState('case');
  const [toast, setToast] = useState(null);
  const [pulling, setPulling] = useState(false);

  const say = (m, bad) => { setToast({ m, bad }); setTimeout(() => setToast(null), 2000); };

  const refresh = async () => {
    try {
      setS(await api.state());
      setErr('');
      setNetErr(false);
    } catch (e) {
      setErr(e.message);
      setNetErr(!!e.isNetwork);
    }
  };

  const signOut = () => {
    logout();
    setUser(null);
    setWho(null);
    setS(null);
    setErr('');
  };

  const onLoggedIn = (u) => {
    // Clients and consultants have a key (case key / 'martin' / 'tereza').
    // Admins have none, so use the admin entry in PEOPLE for display.
    const key = u.key || Object.keys(PEOPLE).find((k) => PEOPLE[k].role === u.role);
    setWho(key);
    setTab(TABS[u.role][0][0]);
    setUser(u);
  };

  // If the server says the session is missing or expired, go back to the login screen
  useEffect(() => { setUnauthorizedHandler(signOut); }, []);

  // Load data only after a successful login and password change
  useEffect(() => {
    if (user && !user.mustChangePassword) refresh();
  }, [user]);

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
      const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date);
      const timeOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
      if (!dateOk || !timeOk) { say('Use YYYY-MM-DD and HH:MM', true); return false; }
      if (date < TODAY) { say('That date is in the past', true); return false; }
      try { await api.addSlot(c, date, time); say('Slot created'); await refresh(); return true; }
      catch (e) { say(e.message, true); return false; }
    },
    delSlot: (id) => run(() => api.delSlot(id), 'Slot removed'),
    setStatus: (c, s) => run(() => api.setStatus(c, s), 'Case set to ' + s),
  };

  // 1. Not logged in
  if (!user) return <LoginScreen onLoggedIn={onLoggedIn} />;

  // 2. Temporary password must be replaced first
  if (user.mustChangePassword) {
    return (
      <ChangePasswordScreen
        onDone={() => setUser({ ...user, mustChangePassword: false })}
        onLogout={signOut}
      />
    );
  }

  // 3. Loading or error
  if (!S) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        {err ? (
          <>
            <Ionicons name={netErr ? 'cloud-offline' : 'alert-circle'} size={44} color={C.mut} />
            <Text style={{ color: C.ink, fontSize: 18, fontWeight: '800', marginTop: 10 }}>
              {netErr ? 'Cannot reach the server' : 'Something went wrong'}
            </Text>
            <Text style={{ color: C.sub, textAlign: 'center', marginVertical: 8 }}>
              {netErr ? 'Check that the API is running and EXPO_PUBLIC_API_URL is correct.' : err}
            </Text>
            <Pressable onPress={refresh}>
              <Text style={{ color: C.brand, fontWeight: '800', fontSize: 16 }}>Try again</Text>
            </Pressable>
            <Pressable onPress={signOut} style={{ marginTop: 16 }}>
              <Text style={{ color: C.sub, fontWeight: '700' }}>Log out</Text>
            </Pressable>
          </>
        ) : <ActivityIndicator color={C.brand} size="large" />}
      </View>
    );
  }

  const role = user.role;
  const person = PEOPLE[who] || { short: user.name };
  const screens = {
    case: <CaseScreen S={S} who={who} a={a} />,
    book: <BookScreen S={S} a={a} />,
    mine: <MineScreen S={S} who={who} a={a} />,
    slots: <SlotsScreen S={S} who={who} a={a} />,
    review: <ReviewScreen S={S} a={a} />,
    cases: <CasesScreen S={S} a={a} />,
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <View style={{
        backgroundColor: C.brandDark, paddingTop: insets.top + 10, paddingHorizontal: 18,
        paddingBottom: 16, borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="shield-checkmark" size={22} color="#5EEAD4" />
            <Text style={{ color: C.white, fontSize: 18, fontWeight: '800' }}>Claro Visa Portal</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
            <Text style={{ color: '#CCFBF1', fontSize: 11, fontWeight: '800' }}>{MODE.toUpperCase()} MODE</Text>
          </View>
        </View>
        <Text style={{ color: C.white, fontSize: 24, fontWeight: '800', marginTop: 16 }}>
          Hello, {person.short}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <Text style={{ color: '#99F6E4' }}>{SUBTITLE[role]}</Text>
          <Pressable
            onPress={signOut}
            style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Text style={{ color: '#CCFBF1', fontWeight: '700', fontSize: 13 }}>Log out</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={(
          <RefreshControl
            refreshing={pulling}
            onRefresh={async () => { setPulling(true); await refresh(); setPulling(false); }}
            tintColor={C.brand}
          />
        )}
      >
        {screens[tab]}
      </ScrollView>

      {!!toast && (
        <View style={{
          position: 'absolute', bottom: 96 + insets.bottom, alignSelf: 'center', flexDirection: 'row',
          gap: 8, alignItems: 'center', backgroundColor: toast.bad ? C.bad : C.ink, borderRadius: 99,
          paddingHorizontal: 16, paddingVertical: 11, ...shadow,
        }}>
          <Ionicons name={toast.bad ? 'alert-circle' : 'checkmark-circle'} size={18} color={C.white} />
          <Text style={{ color: C.white, fontWeight: '600' }}>{toast.m}</Text>
        </View>
      )}

      <View style={{
        flexDirection: 'row', backgroundColor: C.white, paddingBottom: insets.bottom,
        paddingTop: 6, borderTopWidth: 1, borderColor: C.line,
      }}>
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


