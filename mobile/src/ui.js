import React from 'react';
import { Text, View, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initials } from './data';

export const C = {
  bg: '#F3F5F7', card: '#FFFFFF', ink: '#0F172A', sub: '#475569', mut: '#94A3B8', line: '#E5E9EF',
  brand: '#0F766E', brandDark: '#0B3B3C', brandSoft: '#E3F3F0', white: '#FFFFFF',
  ok: '#157347', warn: '#A15C07', bad: '#B42318',
};
export const shadow = { shadowColor: '#0F172A', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 };

const TONES = {
  Approved: { bg: '#DCF5E7', fg: '#157347', icon: 'checkmark-circle' },
  Submitted: { bg: '#E2EBFB', fg: '#2453B8', icon: 'time' },
  Missing: { bg: '#FDE6E4', fg: '#B42318', icon: 'alert-circle' },
  Needs: { bg: '#FEF0D3', fg: '#A15C07', icon: 'create' },
  Preparation: { bg: '#FEF0D3', fg: '#A15C07', icon: 'hourglass' },
  Rejected: { bg: '#FDE6E4', fg: '#B42318', icon: 'close-circle' },
  Booked: { bg: '#99b3e0', fg: '#2453B8', icon: 'calendar' },
};
export const toneOf = (l) => TONES[l.split(' ')[0]] || { bg: C.line, fg: C.sub, icon: 'ellipse' };

export function Pill({ label }) {
  const t = toneOf(label);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 }}>
      <Ionicons name={t.icon} size={12} color={t.fg} />
      <Text style={{ color: t.fg, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export const Card = ({ children, style }) => (
  <View style={[{ backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 12, ...shadow }, style]}>{children}</View>
);

export const Row = ({ children, style }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, style]}>{children}</View>
);

export const Txt = ({ children, style, numberOfLines }) => (
  <Text numberOfLines={numberOfLines} style={[{ color: C.ink, fontSize: 15, fontWeight: '700' }, style]}>{children}</Text>
);
export const Muted = ({ children, style }) => <Text style={[{ color: C.sub, fontSize: 13, marginTop: 2 }, style]}>{children}</Text>;

export const Section = ({ title, hint }) => (
  <View style={{ marginTop: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
    <Text style={{ color: C.ink, fontSize: 18, fontWeight: '800' }}>{title}</Text>
    {!!hint && <Text style={{ color: C.sub, fontSize: 13, fontWeight: '600' }}>{hint}</Text>}
  </View>
);

export function Btn({ title, onPress, icon, kind = 'primary', small, full, style }) {
  const k = {
    primary: { bg: C.brand, fg: C.white, bd: C.brand },
    soft: { bg: C.brandSoft, fg: C.brand, bd: C.brandSoft },
    ghost: { bg: C.white, fg: C.ink, bd: C.line },
    danger: { bg: '#c24e44', fg: C.bad, bd: '#FDE6E4' },
  }[kind];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: k.bg, borderColor: k.bd, borderWidth: 1,
      borderRadius: 12, paddingVertical: small ? 8 : 13, paddingHorizontal: small ? 12 : 16, opacity: pressed ? 0.75 : 1, alignSelf: full ? 'stretch' : 'flex-start',
    }, style]}>
      {!!icon && <Ionicons name={icon} size={small ? 15 : 18} color={k.fg} />}
      <Text style={{ color: k.fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
    </Pressable>
  );
}

const HUES = ['#0F766E', '#2453B8', '#7C3AED', '#B45309', '#BE185D', '#0E7490'];
export function Avatar({ name, size = 40 }) {
  const hue = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: hue + '1F', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: hue, fontWeight: '800', fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}

export const IconBadge = ({ name, color = C.brand, bg = C.brandSoft, size = 40 }) => (
  <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={name} size={size * 0.5} color={color} />
  </View>
);

export const Progress = ({ value }) => (
  <View style={{ height: 8, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' }}>
    <View style={{ width: `${Math.round(value * 100)}%`, height: 8, backgroundColor: C.brand, borderRadius: 4 }} />
  </View>
);

export function Field(props) {
  return (
    <TextInput placeholderTextColor={C.mut} {...props}
      style={[{ borderWidth: 1, borderColor: C.line, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: C.ink, fontSize: 15 }, props.style]} />
  );
}

export const Empty = ({ icon, text }) => (
  <View style={{ alignItems: 'center', padding: 28 }}>
    <Ionicons name={icon} size={34} color={C.mut} />
    <Text style={{ color: C.sub, marginTop: 8, textAlign: 'center' }}>{text}</Text>
  </View>
);

export const Chip = ({ icon, text, color = C.sub }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
    <Ionicons name={icon} size={13} color={color} />
    <Text style={{ color, fontSize: 12.5, fontWeight: '600', flexShrink: 1 }}>{text}</Text>
  </View>
);

















