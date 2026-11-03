import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Btn, Pill, Row, Txt, Muted, Section, Avatar, IconBadge, Progress, Field, Empty, Chip, C, toneOf } from './ui';
import { PEOPLE, CASE_STATUSES, fmtDate, fmtRange, sortSlots, dueInfo, TODAY } from './data';

const LEVEL = { bad: C.bad, warn: C.warn, ok: C.sub };
const isOpen = (d) => d.status === 'Missing' || d.status === 'Needs correction';

function Stepper({ status }) {
  const final = status === 'Approved' || status === 'Rejected';
  const idx = final ? 2 : status === 'Submitted' ? 1 : 0;
  const labels = ['Preparation', 'Submitted', final ? status : 'Decision'];
  return (
    <View style={{ flexDirection: 'row', marginTop: 16 }}>
      {labels.map((l, i) => {
        const done = i < idx || (final && i === 2 && status === 'Approved');
        const rej = final && i === 2 && status === 'Rejected';
        const on = i <= idx;
        const col = rej ? C.bad : on ? C.brand : C.line;
        return (
          <View key={l} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View style={{ flex: 1, height: 3, backgroundColor: i === 0 ? 'transparent' : (i <= idx ? C.brand : C.line) }} />
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: on ? col : C.white, borderWidth: 2, borderColor: col, alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Ionicons name="checkmark" size={15} color={C.white} /> : rej ? <Ionicons name="close" size={15} color={C.white} /> : on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.white }} /> : null}
              </View>
              <View style={{ flex: 1, height: 3, backgroundColor: i === 2 ? 'transparent' : (i < idx ? C.brand : C.line) }} />
            </View>
            <Text style={{ marginTop: 6, fontSize: 12, fontWeight: on ? '700' : '500', color: on ? C.ink : C.mut }}>{l}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function CaseScreen({ S, who, a }) {
  const c = S.cases[who];
  const approved = c.docs.filter((d) => d.status === 'Approved').length;
  const next = c.docs.filter(isOpen).sort((x, y) => (x.due || '9').localeCompare(y.due || '9'))[0];
  const nextAt = next ? c.docs.indexOf(next) : -1;
  return (
    <View>
      <Card>
        <Row>
          <Row style={{ flex: 1, justifyContent: 'flex-start' }}>
            <Avatar name={c.name} size={46} />
            <View style={{ flex: 1 }}><Txt style={{ fontSize: 17 }}>{c.uni}</Txt><Muted>{c.from} → Czech Republic · Study visa</Muted></View>
          </Row>
        </Row>
        <Stepper status={c.status} />
        <View style={{ marginTop: 18 }}>
          <Row style={{ marginBottom: 6 }}><Muted>Documents approved</Muted><Txt style={{ fontSize: 13 }}>{approved} / {c.docs.length}</Txt></Row>
          <Progress value={approved / c.docs.length} />
        </View>
      </Card>

      <View style={{ backgroundColor: C.brandDark, borderRadius: 18, padding: 16, marginBottom: 12, flexDirection: 'row', gap: 12 }}>
        <Ionicons name={next ? 'arrow-forward-circle' : 'checkmark-circle'} size={30} color="#5EEAD4" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#99F6E4', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>YOUR NEXT STEP</Text>
          <Text style={{ color: C.white, fontSize: 16, fontWeight: '700', marginTop: 3 }}>
            {next ? `${next.status === 'Missing' ? 'Upload' : 'Fix and re-upload'} ${next.name.toLowerCase()}` : 'All documents are in. Nothing to do.'}
          </Text>
          {next && <Text style={{ color: '#CCFBF1', marginTop: 3 }}>{dueInfo(next.due).text}</Text>}
          {next && <View style={{ marginTop: 10 }}><Btn small kind="soft" icon="cloud-upload" title="Upload now" onPress={() => a.upload(who, nextAt)} /></View>}
        </View>
      </View>

      <Section title="Documents" hint={`${c.docs.filter(isOpen).length} to do`} />
      {c.docs.map((d, i) => {
        const t = toneOf(d.status);
        const due = d.due && d.status !== 'Approved' ? dueInfo(d.due) : null;
        return (
          <Card key={d.name} style={{ padding: 14 }}>
            <Row style={{ alignItems: 'flex-start' }}>
              <IconBadge name={t.icon} color={t.fg} bg={t.bg} />
              <View style={{ flex: 1 }}>
                <Txt>{d.name}</Txt>
                {due && <Chip icon="calendar-outline" text={due.text} color={LEVEL[due.level]} />}
                {!!d.file && <Chip icon="attach" text={d.file} />}
              </View>
              <Pill label={d.status} />
            </Row>
            {!!d.note && (
              <View style={{ backgroundColor: '#FEF0D3', borderRadius: 10, padding: 10, marginTop: 10, flexDirection: 'row', gap: 8 }}>
                <Ionicons name="chatbubble-ellipses" size={16} color={C.warn} />
                <Text style={{ flex: 1, color: '#7A4505', fontSize: 13 }}>{d.note}</Text>
              </View>
            )}
            {isOpen(d) && <View style={{ marginTop: 12 }}><Btn small kind={d.status === 'Missing' ? 'primary' : 'soft'} icon="cloud-upload" title={d.status === 'Missing' ? 'Upload file' : 'Upload corrected file'} onPress={() => a.upload(who, i)} /></View>}
          </Card>
        );
      })}
    </View>
  );
}

const DateBlock = ({ date }) => {
  const d = new Date(date + 'T00:00');
  return (
    <View style={{ width: 48, borderRadius: 12, backgroundColor: C.brandSoft, alignItems: 'center', paddingVertical: 6 }}>
      <Text style={{ color: C.brand, fontSize: 11, fontWeight: '800' }}>{d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}</Text>
      <Text style={{ color: C.brand, fontSize: 20, fontWeight: '800' }}>{d.getDate()}</Text>
    </View>
  );
};

export function BookScreen({ S, a }) {
  const free = S.slots.filter((s) => !s.by && s.date >= TODAY).sort(sortSlots);
  const days = [...new Set(free.map((s) => s.date))];
  return (
    <View>
      <Section title="Book a consultation" hint="30 min · video call" />
      {free.length === 0 && <Card><Empty icon="calendar-outline" text="No free slots right now. Please check back soon." /></Card>}
      {days.map((day) => (
        <View key={day}>
          <Text style={{ color: C.sub, fontWeight: '700', marginBottom: 8, marginTop: 4 }}>{fmtDate(day)}</Text>
          {free.filter((s) => s.date === day).map((s) => (
            <Card key={s.id} style={{ padding: 14 }}>
              <Row>
               <Avatar name={PEOPLE[s.consultant]?.name || 'Consultant'} />

<View style={{ flex: 1 }}>
  <Txt>{fmtRange(s.time)}</Txt>
  <Muted>{PEOPLE[s.consultant]?.name || 'Consultant'}</Muted>
</View>
              </Row>
            </Card>
          ))}
        </View>
      ))}
    </View>
  );
}

export function MineScreen({ S, who, a }) {
  const mine = S.slots.filter((s) => s.by === who).sort(sortSlots);
  return (
    <View>
      <Section title="My bookings" hint={`${mine.length} upcoming`} />
      {mine.length === 0 && <Card><Empty icon="bookmark-outline" text="You have no bookings yet. Open the Book tab to reserve a time." /></Card>}
      {mine.map((s) => (
        <Card key={s.id}>
          <Row style={{ alignItems: 'flex-start' }}>
            <DateBlock date={s.date} />
            <View style={{ flex: 1 }}>
              <Txt>{fmtDate(s.date)} · {fmtRange(s.time)}</Txt>
              <Muted>with {PEOPLE[s.consultant].name}</Muted>
              <Chip icon="videocam-outline" text="30 min video call" />
            </View>
          </Row>
          <View style={{ marginTop: 12 }}><Btn small kind="danger" icon="close" title="Cancel booking" onPress={() => a.cancel(s.id)} /></View>
        </Card>
      ))}
    </View>
  );
}

export function SlotsScreen({ S, who, a }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const mine = S.slots.filter((s) => s.consultant === who).sort(sortSlots);
  return (
    <View>
      <Section title="Create an available slot" hint="30 min each" />
      <Card>
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ flex: 1.3 }}><Muted style={{ marginBottom: 6 }}>Date</Muted><Field placeholder="2026-10-23" value={date} onChangeText={setDate} autoCapitalize="none" /></View>
          <View style={{ flex: 1 }}><Muted style={{ marginBottom: 6 }}>Start time</Muted><Field placeholder="10:00" value={time} onChangeText={setTime} autoCapitalize="none" /></View>
        </Row>
        <Btn full icon="add-circle" title="Add slot" style={{ marginTop: 14 }} onPress={async () => { if (await a.addSlot(who, date, time)) { setDate(''); setTime(''); } }} />
      </Card>
      <Section title="My slots" hint={`${mine.filter((s) => !s.by).length} free`} />
      {mine.length === 0 && <Card><Empty icon="time-outline" text="No slots yet. Create your first one above." /></Card>}
      {mine.map((s) => (
        <Card key={s.id} style={{ padding: 14 }}>
          <Row>
            <DateBlock date={s.date} />
            <View style={{ flex: 1 }}>
              <Txt>{fmtRange(s.time)}</Txt>
              <Muted>{s.by ? `Booked by ${S.cases[s.by].name}` : 'Free · visible to clients'}</Muted>
            </View>
            {s.by ? <Pill label="Booked" /> : <Btn small kind="ghost" icon="trash-outline" title="Remove" onPress={() => a.delSlot(s.id)} />}
          </Row>
        </Card>
      ))}
    </View>
  );
}

function ReviewCard({ caseId, index, d, S, a }) {
  const [note, setNote] = useState('');
  const c = S.cases[caseId];
  return (
    <Card>
      <Row style={{ alignItems: 'flex-start' }}>
        <Avatar name={c.name} />
        <View style={{ flex: 1 }}>
          <Txt>{d.name}</Txt>
          <Muted>{c.name} · {c.uni}</Muted>
          {!!d.file && <Chip icon="attach" text={d.file} color={C.brand} />}
        </View>
        <Pill label={d.status} />
      </Row>
      <Field multiline placeholder="Correction note (required to send back)" value={note} onChangeText={setNote} style={{ marginTop: 12, minHeight: 60, textAlignVertical: 'top' }} />
      <Row style={{ marginTop: 12, justifyContent: 'flex-start' }}>
        <Btn small icon="checkmark" title="Approve" onPress={() => a.review(caseId, index, true)} />
        <Btn small kind="danger" icon="arrow-undo" title="Needs correction" onPress={() => a.review(caseId, index, false, note)} />
      </Row>
    </Card>
  );
}

export function ReviewScreen({ S, a }) {
  const items = [];
  Object.keys(S.cases).forEach((c) => S.cases[c].docs.forEach((d, i) => { if (d.status === 'Submitted') items.push({ c, i, d }); }));
  return (
    <View>
      <Section title="Documents to review" hint={`${items.length} waiting`} />
      {items.length === 0 && <Card><Empty icon="checkmark-done-circle-outline" text="You're all caught up. Nothing is waiting for review." /></Card>}
      {items.map(({ c, i, d }) => <ReviewCard key={c + i + d.file} caseId={c} index={i} d={d} S={S} a={a} />)}
    </View>
  );
}

const Stat = ({ icon, n, label }) => (
  <View style={{ flex: 1, backgroundColor: C.white, borderRadius: 16, padding: 12, alignItems: 'center' }}>
    <Ionicons name={icon} size={20} color={C.brand} />
    <Text style={{ color: C.ink, fontSize: 22, fontWeight: '800', marginTop: 4 }}>{n}</Text>
    <Text style={{ color: C.sub, fontSize: 12 }}>{label}</Text>
  </View>
);

export function CasesScreen({ S, a }) {
  const cases = Object.entries(S.cases);
  const waiting = cases.reduce((n, [, c]) => n + c.docs.filter((d) => d.status === 'Submitted').length, 0);
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
        <Stat icon="people" n={cases.length} label="Clients" />
        <Stat icon="document-text" n={waiting} label="To review" />
        <Stat icon="calendar" n={S.slots.filter((s) => !s.by).length} label="Free slots" />
      </View>
      <Section title="All cases" />
      {cases.map(([k, c]) => {
        const ok = c.docs.filter((d) => d.status === 'Approved').length;
        return (
          <Card key={k}>
            <Row>
              <Avatar name={c.name} />
              <View style={{ flex: 1 }}><Txt>{c.name}</Txt><Muted>{c.from} → {c.uni}</Muted></View>
              <Pill label={c.status} />
            </Row>
            <View style={{ marginTop: 14 }}>
              <Row style={{ marginBottom: 6 }}><Muted>Documents approved</Muted><Txt style={{ fontSize: 13 }}>{ok} / {c.docs.length}</Txt></Row>
              <Progress value={ok / c.docs.length} />
            </View>
            <View style={{ flexDirection: 'row', backgroundColor: C.bg, borderRadius: 12, padding: 3, marginTop: 14 }}>
              {CASE_STATUSES.map((s) => {
                const on = s === c.status;
                return (
                  <Text key={s} onPress={() => a.setStatus(k, s)} style={{ flex: 1, textAlign: 'center', paddingVertical: 8, borderRadius: 10, overflow: 'hidden', fontSize: 11.5, fontWeight: '700', color: on ? C.white : C.sub, backgroundColor: on ? C.brand : 'transparent' }}>{s}</Text>
                );
              })}
            </View>
          </Card>
        );
      })}
    </View>
  );
}
