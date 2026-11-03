// Profile: my details, where and when I work, notifications, Outlook and Framepoint, sign-in, help, sign out.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconUser, IconMapPin, IconBell, IconPlugConnected, IconShieldLock, IconHelpCircle, IconRefresh, IconLogout, IconChevronRight, IconBrandWindows, IconCircleCheck, IconDeviceMobile, IconLock, IconInfoCircle, IconPhone, IconMail, IconBook, IconCamera, IconSparkles } from '@tabler/icons-react';
import { Screen, Header, Avatar, Tag, Field, Switch, Sheet, useToast, setSignedIn } from '../ui/kit';
import { me } from '../data/mock';
import { useStore } from '../data/store';
import { useMyVisits } from '../lib/visits';

export default function Profile() {
  const nav = useNavigate();
  const toast = useToast();
  const { reset } = useStore();
  const visits = useMyVisits();
  const [out, setOut] = useState(false);
  const done = visits.filter(v => v.status === 'Submitted').length;
  const sv = visits.filter(v => v.kind === 'Final survey' && v.status === 'Submitted');
  const match = sv.length ? Math.round((sv.filter(v => !v.changed).length / sv.length) * 100) : 100;
  const row = (to: string, I: any, l: string, s?: string) => <Link to={to} className="li"><span className="ic"><I size={19} /></span><span className="vstack grow" style={{ gap: 0 }}>{l}{s && <span className="tiny muted">{s}</span>}</span><IconChevronRight size={18} className="chev" /></Link>;
  return (
    <Screen tabs header={<div className="hdr-lg"><h1>Profile</h1></div>}>
      <div className="pad" style={{ paddingTop: 4 }}>
        <div className="card" style={{ alignItems: 'center', textAlign: 'center', background: 'linear-gradient(180deg, #ebf7f3, #fff 70%)' }}>
          <Avatar i={me.initials} size={76} bg="#00c7a1" fg="#0b1f1b" />
          <div className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 19 }}>{me.name}</b><span className="small muted">{me.role} · Jadeite Glazing</span></div>
          <div className="grid-3" style={{ width: '100%' }}>
            {[[String(done), 'Visits done'], [`${match}%`, 'Sizes matched'], ['5', 'Days a week']].map(([n, l]) => <div key={l} className="vstack" style={{ gap: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 4px' }}><b style={{ fontSize: 17 }}>{n}</b><span className="tiny muted">{l}</span></div>)}
          </div>
        </div>
        <div className="card flush"><div className="list">
          {row('/profile/details', IconUser, 'My details', `${me.email}`)}
          {row('/profile/work', IconMapPin, 'Area and working days', me.area)}
          {row('/profile/notifications', IconBell, 'Notifications', 'What to be told about')}
          {row('/profile/connections', IconPlugConnected, 'Outlook and Framepoint', 'Both connected')}
          {row('/profile/security', IconShieldLock, 'Sign-in and security', 'Two-step sign-in is on')}
        </div></div>
        <div className="card flush"><div className="list">
          {row('/profile/help', IconHelpCircle, 'Help and contact the office')}
          <button className="li" onClick={() => nav('/welcome/1')}><span className="ic"><IconSparkles size={19} /></span><span className="grow">Take the tour again</span><IconChevronRight size={18} className="chev" /></button>
          <button className="li" onClick={() => { reset(); toast('Demo data reset'); nav('/'); }}><span className="ic"><IconRefresh size={19} /></span><span className="vstack grow" style={{ gap: 0 }}>Reset demo data<span className="tiny muted">Start the demo again</span></span></button>
          <button className="li danger" onClick={() => setOut(true)}><span className="ic"><IconLogout size={19} /></span><span className="grow">Sign out</span></button>
        </div></div>
        <span className="tiny muted" style={{ textAlign: 'center' }}>Jadeite Surveyor · version 1.0 · © 2026 Jadeite Systems</span>
      </div>
      {out && <Sheet title="Sign out?" sub="Anything you started is saved." onClose={() => setOut(false)} footer={<><button className="btn btn-grey" onClick={() => setOut(false)}>Cancel</button><button className="btn btn-danger" onClick={() => { setSignedIn(false); nav('/login'); }}><IconLogout size={18} />Sign out</button></>}><span className="t2">You will need your password and a code sent to your phone to sign in again.</span></Sheet>}
    </Screen>
  );
}

const SaveFoot = ({ label = 'Save changes' }: { label?: string }) => { const toast = useToast(); const nav = useNavigate(); return <button className="btn btn-primary btn-block" onClick={() => { toast('Saved'); nav('/profile'); }}>{label}</button>; };

export function Details() {
  const toast = useToast();
  return (
    <Screen header={<Header back="/profile" title="My details" />} foot={<SaveFoot />}>
      <div className="pad">
        <div className="vstack" style={{ alignItems: 'center', gap: 8 }}><Avatar i={me.initials} size={84} bg="#00c7a1" fg="#0b1f1b" /><button className="link" onClick={() => toast('Photo updated')}><IconCamera size={15} />Change photo</button></div>
        <Field label="Full name"><input className="input" defaultValue={me.name} /></Field>
        <Field label="Email"><input className="input" type="email" defaultValue={me.email} /></Field>
        <Field label="Mobile" hint="For sign-in codes and texts to customers"><input className="input" type="tel" defaultValue={me.phone} /></Field>
        <Field label="Role" hint="Roles are managed by the System Admin"><input className="input" defaultValue={me.role} disabled /></Field>
      </div>
    </Screen>
  );
}

export function Work() {
  const [days, setDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [max, setMax] = useState(4);
  return (
    <Screen header={<Header back="/profile" title="Area and working days" />} foot={<SaveFoot />}>
      <div className="pad">
        <Field label="Area I cover" hint="The office uses this when booking your visits"><input className="input" defaultValue={me.area} /></Field>
        <Field label="Days I work"><div className="grid-3">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <button key={d} type="button" className={`chip ${days.includes(d) ? 'on' : ''}`} style={{ justifyContent: 'center' }} onClick={() => setDays(ds => (ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]))}>{d}</button>)}</div></Field>
        <Field label="Most visits in one day"><div className="seg">{[2, 3, 4, 5].map(n => <button key={n} type="button" className={max === n ? 'on' : ''} onClick={() => setMax(n)}>{n}</button>)}</div></Field>
        <div className="alert info"><IconInfoCircle size={17} />For a day off, use Time off in your calendar.</div>
      </div>
    </Screen>
  );
}

export function NotificationsSettings() {
  const toast = useToast();
  const [n, setN] = useState<Record<string, boolean>>({ booked: true, moved: true, office: true, revised: true, daily: true, email: false });
  const items: [string, string, string][] = [['booked', 'A visit is booked for me', 'Straight away'], ['moved', 'A visit is moved or cancelled', 'Straight away'], ['office', 'The office sends me a message', 'Straight away'], ['revised', 'A quote is revised after my survey', 'So you know the order is going ahead'], ['daily', "Tomorrow's route", 'Every working day at 6pm'], ['email', 'Also send these by email', 'As well as on your phone']];
  return (
    <Screen header={<Header back="/profile" title="Notifications" />}>
      <div className="pad">
        <span className="small t2">Tell me when…</span>
        <div className="card flush"><div className="list">
          {items.map(([k, l, s]) => <div key={k} className="li"><span className="vstack grow" style={{ gap: 1 }}>{l}<span className="tiny muted">{s}</span></span><Switch on={n[k]} label={l} onChange={v => { setN({ ...n, [k]: v }); toast(v ? 'Turned on' : 'Turned off'); }} /></div>)}
        </div></div>
      </div>
    </Screen>
  );
}

export function Connections() {
  const toast = useToast();
  const [sync, setSync] = useState({ outlook: '2 minutes ago', fp: '5 minutes ago' });
  return (
    <Screen header={<Header back="/profile" title="Outlook and Framepoint" />}>
      <div className="pad">
        <div className="card">
          <div className="hstack" style={{ gap: 12 }}><span className="tile" style={{ width: 44, height: 44, borderRadius: 12, background: '#e8f1fb', color: '#0b6e5c' }}><IconBrandWindows size={22} /></span><span className="vstack grow" style={{ gap: 1 }}><b>Outlook calendar</b><span className="tiny muted">Synced {sync.outlook}</span></span><Tag tone="ok" icon={<IconCircleCheck size={12} />}>Connected</Tag></div>
          <span className="small t2">Every visit the office books for you goes into Outlook. Busy times in Outlook stop the office booking you then.</span>
          <button className="btn btn-outline btn-sm" onClick={() => { setSync(x => ({ ...x, outlook: 'just now' })); toast('Synced with Outlook'); }}><IconRefresh size={16} />Sync now</button>
        </div>
        <div className="card">
          <div className="hstack" style={{ gap: 12 }}><span className="tile" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--tint)', color: '#0b6e5c' }}><IconPlugConnected size={22} /></span><span className="vstack grow" style={{ gap: 1 }}><b>Framepoint</b><span className="tiny muted">Read only · synced {sync.fp}</span></span><Tag tone="ok" icon={<IconCircleCheck size={12} />}>Connected</Tag></div>
          <span className="small t2">You see every item, size and product the salesperson measured. Changes to the quote are made by the salesperson.</span>
          <button className="btn btn-outline btn-sm" onClick={() => { setSync(x => ({ ...x, fp: 'just now' })); toast('Synced with Framepoint'); }}><IconRefresh size={16} />Sync now</button>
        </div>
        <div className="alert info"><IconInfoCircle size={17} />Connections are set up by the System Admin. Ask the office if one stops working.</div>
      </div>
    </Screen>
  );
}

export function Security() {
  const toast = useToast();
  const [face, setFace] = useState(true);
  const rows: [any, string, string, string, string][] = [[IconDeviceMobile, 'Two-step sign-in is on', `Code by text to •• ${me.phone.slice(-3)}`, 'Change phone', 'A code was sent to your new number'], [IconLock, 'Password', 'Changed 4 months ago', 'Change', 'We emailed you a link to change your password'], [IconDeviceMobile, 'Signed in on', 'This phone · Work tablet', 'Sign out others', 'Signed out of other devices']];
  return (
    <Screen header={<Header back="/profile" title="Sign-in and security" />}>
      <div className="pad">
        <div className="card flush"><div className="list">
          {rows.map(([I, l, s, b, t]) => <div key={l} className="li"><span className="ic"><I size={19} /></span><span className="vstack grow" style={{ gap: 1 }}>{l}<span className="tiny muted">{s}</span></span><button className="btn btn-outline btn-xs" onClick={() => toast(t)}>{b}</button></div>)}
          <div className="li"><span className="ic"><IconShieldLock size={19} /></span><span className="vstack grow" style={{ gap: 1 }}>Unlock with Face ID<span className="tiny muted">Instead of your password on this phone</span></span><Switch on={face} label="Face ID" onChange={v => { setFace(v); toast(v ? 'Face ID turned on' : 'Face ID turned off'); }} /></div>
        </div></div>
      </div>
    </Screen>
  );
}

export function Help() {
  const toast = useToast();
  return (
    <Screen header={<Header back="/profile" title="Help" />}>
      <div className="pad">
        <div className="card flush"><div className="list">
          <a className="li" href="tel:01134960000" onClick={() => toast('Calling the office')}><span className="ic"><IconPhone size={19} /></span><span className="vstack grow" style={{ gap: 1 }}>Call the office<span className="tiny muted">0113 496 0000 · Mon–Fri 8am–5pm</span></span></a>
          <a className="li" href="mailto:office@jadeiteglazing.co.uk"><span className="ic"><IconMail size={19} /></span><span className="vstack grow" style={{ gap: 1 }}>Email the office<span className="tiny muted">office@jadeiteglazing.co.uk</span></span></a>
        </div></div>
        <span className="tiny b muted">COMMON QUESTIONS</span>
        <div className="card flush"><div className="list">
          {[['What counts as the same size?', 'Within 5mm of the salesperson’s size, in width and height. More than that is marked Changed and the salesperson revises the quote.'], ['I wrote the sizes on paper', 'On the Measure step, tap Upload paperwork report and take a photo of the sheet. You don’t need to type the sizes.'], ['The customer is not in', 'Open the visit, tap the three dots, then Customer not in. The office rebooks it.'], ['I can’t make a visit', 'Open the visit and tap Can’t make it. The office moves it and tells the customer.']].map(([q, a]) => (
            <details key={q} className="li" style={{ display: 'block' }}><summary style={{ fontWeight: 600, cursor: 'pointer', listStyle: 'none' }} className="hstack"><IconBook size={17} color="#0b6e5c" />{q}</summary><p className="small t2" style={{ marginTop: 8 }}>{a}</p></details>
          ))}
        </div></div>
      </div>
    </Screen>
  );
}
