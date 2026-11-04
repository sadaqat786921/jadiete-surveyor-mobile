// Splash → sign in → security code (482193, 3 wrong codes locks the account) → welcome tour → make it yours.
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  IconMail, IconLock, IconEye, IconEyeOff, IconChevronLeft, IconShieldLock, IconFaceId, IconMessageCircle, IconCar, IconRoute, IconBrandWindows,
  IconRuler, IconFileText, IconCircleCheck, IconSignature, IconPhoto, IconSend, IconBell, IconMapPin, IconCheck, IconClock, IconListCheck,
} from '@tabler/icons-react';
import { StatusBar, Field, Switch, Check, Avatar, Tag, setSignedIn, useToast } from '../ui/kit';
import { IMG, me } from '../data/mock';

const CODE = '482193';

const Logo = () => <div className="logo"><img src="images/mark.svg" alt="" /><span className="vstack" style={{ gap: 0 }}><b>Jadeite</b><span className="sub">Surveyor</span></span></div>;

export function Splash() {
  const nav = useNavigate();
  useEffect(() => { const t = setTimeout(() => nav('/login', { replace: true }), 1800); return () => clearTimeout(t); }, [nav]);
  return (
    <div className="splash" onClick={() => nav('/login', { replace: true })} role="button" aria-label="Continue to sign in">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><StatusBar light /></div>
      {[260, 420, 580, 740].map(d => <span key={d} className="ring" style={{ width: d, height: d }} />)}
      <span className="tile" style={{ width: 84, height: 84, borderRadius: 26, background: 'rgba(255,255,255,.1)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.15)' }}><img src="images/mark-glass.svg" alt="" style={{ width: 50, height: 50 }} onError={e => ((e.target as HTMLImageElement).src = 'images/mark.svg')} /></span>
      <b style={{ fontSize: 30, letterSpacing: -1, fontWeight: 700 }}>Jadeite</b>
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,.72)', marginTop: -8 }}>Every size checked before we order</span>
      <span style={{ position: 'absolute', bottom: 44, fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Jadeite Glazing · Surveyor</span>
    </div>
  );
}

export function Login() {
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState(me.email);
  const [pw, setPw] = useState('surveys2026');
  const [show, setShow] = useState(false);
  const [keep, setKeep] = useState(true);
  const ok = /.+@.+\..+/.test(email) && pw.length >= 4;
  return (
    <div className="auth">
      <StatusBar />
      <div className="form">
        <div style={{ marginTop: 16 }}><Logo /></div>
        <div className="vstack" style={{ gap: 8, marginTop: 10 }}><h1>Welcome back</h1><span className="lead">Sign in to see the visits the office has booked for you.</span></div>
        <Field label="Work email"><div className="input-icon"><IconMail size={20} /><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email address" /></div></Field>
        <Field label="Password">
          <div className="input-icon"><IconLock size={20} /><input className="input" type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} aria-label="Password" style={{ paddingRight: 52 }} />
            <button type="button" className="icon-btn ghost" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} style={{ position: 'absolute', right: 5, top: 5 }}>{show ? <IconEyeOff size={20} /> : <IconEye size={20} />}</button></div>
        </Field>
        <div className="between" style={{ marginTop: -4 }}><div style={{ width: 'auto' }}><Check on={keep} onChange={setKeep} label="Remember me" /></div><button className="link" onClick={() => nav('/forgot')}>Forgot password?</button></div>
        <button className="btn btn-primary btn-block" disabled={!ok} onClick={() => { toast(`Code sent by text to •• ${me.phone.slice(-3)}`); nav('/code'); }}>Sign in</button>
        <div className="or">or</div>
        <button className="btn btn-outline btn-block" onClick={() => { setSignedIn(true); toast('Signed in with Face ID'); nav('/'); }}><IconFaceId size={22} />Sign in with Face ID</button>
        <button className="file" style={{ marginTop: 'auto' }} onClick={() => toast('Open the invite link the office emailed you to set your password')}>
          <span className="icircle jade"><IconMessageCircle size={20} /></span>
          <span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 14, fontWeight: 600 }}>First time here?</b><span className="tiny muted">Open the invite link the office sent you.</span></span>
          <span className="link">Activate</span>
        </button>
      </div>
    </div>
  );
}

export function Code() {
  const nav = useNavigate();
  const toast = useToast();
  const [d, setD] = useState(['', '', '', '', '', '']);
  const [tries, setTries] = useState(0);
  const [bad, setBad] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  const code = d.join('');
  const verify = () => {
    if (code === CODE) { setSignedIn(true); nav('/welcome/1'); return; }
    const n = tries + 1; setTries(n); setBad(true); setD(['', '', '', '', '', '']); refs.current[0]?.focus();
    if (n >= 3) nav('/locked');
  };
  const put = (i: number, val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length > 1) { const nd = digits.slice(0, 6).split(''); setD([...nd, ...Array(6 - nd.length).fill('')]); refs.current[Math.min(5, nd.length)]?.focus(); setBad(false); return; }
    const nd = [...d]; nd[i] = digits; setD(nd); setBad(false);
    if (digits && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <div className="auth">
      <StatusBar />
      <div className="form">
        <div className="between"><button className="icon-btn" aria-label="Back" onClick={() => nav('/login')}><IconChevronLeft size={22} /></button><span className="tiny muted">Step 2 of 2</span></div>
        <div className="vstack" style={{ gap: 8, marginTop: 6 }}><h1>Enter your code</h1><span className="lead">We sent a 6-digit code by text to •• {me.phone.slice(-3)}.</span></div>
        <div className={`codebox ${bad ? 'bad' : ''}`}>
          {d.map((x, i) => <input key={i} ref={el => { refs.current[i] = el; }} inputMode="numeric" maxLength={6} value={x} aria-label={`Digit ${i + 1}`} onChange={e => put(i, e.target.value)} onKeyDown={e => { if (e.key === 'Backspace' && !d[i] && i > 0) refs.current[i - 1]?.focus(); if (e.key === 'Enter' && code.length === 6) verify(); }} />)}
        </div>
        {bad && <div className="alert err"><IconShieldLock size={16} /><span>That code is not right. <b>{3 - tries} {3 - tries === 1 ? 'try' : 'tries'} left</b> before the account is locked.</span></div>}
        <button className="btn btn-primary btn-block" disabled={code.length < 6} onClick={verify}>Verify and continue</button>
        <button className="link" style={{ alignSelf: 'center' }} onClick={() => toast('A new code was sent')}>Send the code again</button>
        <span className="tiny muted" style={{ textAlign: 'center', marginTop: 'auto' }}>Demo code · 482193</span>
      </div>
    </div>
  );
}

export function Locked() {
  const nav = useNavigate();
  return (
    <div className="auth">
      <StatusBar />
      <div className="success">
        <span className="ring warn"><IconLock size={44} stroke={1.6} /></span>
        <h2>Account locked</h2>
        <span className="lead" style={{ fontSize: 14.5 }}>The code was wrong 3 times, so we locked your account to keep customer details safe. Call the office to unlock it.</span>
        <div className="vstack" style={{ width: '100%', gap: 10, marginTop: 14 }}>
          <a className="btn btn-primary btn-block" href="tel:01134960000">Call the office</a>
          <button className="btn btn-outline btn-block" onClick={() => nav('/login')}>Back to sign in</button>
        </div>
      </div>
    </div>
  );
}

export function Forgot() {
  const nav = useNavigate();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(me.email);
  return (
    <div className="auth">
      <StatusBar />
      <div className="form">
        <button className="icon-btn" aria-label="Back" onClick={() => nav('/login')}><IconChevronLeft size={22} /></button>
        <div className="vstack" style={{ gap: 8, marginTop: 6 }}><h1>Forgot your password?</h1><span className="lead">We will email you a link to set a new one.</span></div>
        {sent ? <div className="alert ok"><IconCircleCheck size={16} /><span><b>Link sent to {email}.</b> It works for 30 minutes.</span></div>
          : <Field label="Work email"><div className="input-icon"><IconMail size={20} /><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div></Field>}
        {sent ? <button className="btn btn-primary btn-block" onClick={() => nav('/login')}>Back to sign in</button> : <button className="btn btn-primary btn-block" disabled={!/.+@.+\..+/.test(email)} onClick={() => setSent(true)}>Send the link</button>}
      </div>
    </div>
  );
}

/* ---------- Welcome tour: floating cards like a product shot ---------- */
const Float = ({ icon, children, style }: { icon: React.ReactNode; children: React.ReactNode; style: React.CSSProperties }) => <span className="float" style={style}><span className="ic">{icon}</span>{children}</span>;

function Art1() {
  return (
    <div className="stagef">
      <Float icon={<IconBrandWindows size={17} />} style={{ left: 0, top: 18 }}>Outlook synced</Float>
      <Float icon={<IconCar size={17} />} style={{ right: 0, top: 44 }}>On my way</Float>
      <div className="card" style={{ position: 'absolute', left: 14, right: 14, top: 92, gap: 12 }}>
        <div className="between"><span className="pill-sel" style={{ height: 34 }}><span className="ic" style={{ width: 26, height: 26 }}><IconRoute size={15} /></span>Today's route</span><span className="outline-pill">3 visits</span></div>
        {[['10:00', 'Mrs Hughes', 'Knaresborough', 'now'], ['13:30', 'Mr & Mrs Collins', 'Harrogate', ''], ['15:30', 'Mrs Cooper', 'Ripon', '']].map(([t, n, p, s], i) => (
          <div key={n} className="hstack" style={{ gap: 12 }}>
            <span className="tile" style={{ width: 26, height: 26, borderRadius: '50%', background: s ? 'var(--deep)' : 'var(--field)', color: s ? '#fff' : 'var(--muted)', fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
            <span className="vstack grow" style={{ gap: 0 }}><b style={{ fontSize: 13.5, fontWeight: 600 }}>{n}</b><span className="tiny muted">{t} · {p}</span></span>
          </div>
        ))}
      </div>
      <Float icon={<IconClock size={17} />} style={{ left: 4, bottom: 6 }}>25 min drive</Float>
      <Float icon={<IconMapPin size={17} />} style={{ right: 6, bottom: 24 }}>Directions</Float>
    </div>
  );
}
function Art2() {
  return (
    <div className="stagef">
      <Float icon={<IconFileText size={17} />} style={{ right: 0, top: 18 }}>Paperwork report</Float>
      <div className="card" style={{ position: 'absolute', left: 14, right: 14, top: 74, gap: 12 }}>
        <div className="between"><b style={{ fontSize: 14.5, fontWeight: 600 }}>1. Lounge · Sash window</b><Tag tone="ok">Same</Tag></div>
        <div className="salesbox"><span>Sales measured</span><b style={{ color: 'var(--text)' }}>950 × 1600 mm</b></div>
        <div className="grid-2">{[['Width', '952'], ['Height', '1600']].map(([l, v]) => <div key={l} className="vstack" style={{ gap: 4 }}><span className="tiny muted">{l} (mm)</span><span style={{ height: 46, borderRadius: 14, background: 'var(--field)', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 600 }}>{v}</span></div>)}</div>
      </div>
      <Float icon={<IconRuler size={17} />} style={{ left: 2, bottom: 40 }}>Within 5mm = same</Float>
      <Float icon={<IconPhoto size={17} />} style={{ right: 10, bottom: 4 }}>3 photos</Float>
    </div>
  );
}
function Art3() {
  return (
    <div className="stagef">
      <Float icon={<IconSend size={17} />} style={{ right: 0, top: 14 }}>Sent to the office</Float>
      <div className="grid-2" style={{ position: 'absolute', left: 14, right: 14, top: 70 }}>
        <div className="mini"><span className="ic"><IconListCheck size={19} /></span><b style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Site checks</b><span className="tiny muted">9 of 9 answered</span><div className="bars">{[1, 1, 1, 1, 1].map((_, i) => <i key={i} className="on" />)}</div></div>
        <div className="mini"><span className="ic"><IconSignature size={19} /></span><b style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Signed</b><span className="tiny muted">Mrs Hughes</span><div className="bars">{[1, 1, 1, 1, 0].map((o, i) => <i key={i} className={o ? 'on' : ''} />)}</div></div>
        <div className="mini" style={{ gridColumn: 'span 2', flexDirection: 'row', alignItems: 'center', gap: 12 }}><Avatar i="AH" size={42} /><span className="vstack grow" style={{ gap: 1 }}><b style={{ fontSize: 14, fontWeight: 600 }}>Mrs Hughes</b><span className="tiny muted">Final survey · 5 frames</span></span><Tag tone="ok">Submitted</Tag></div>
      </div>
      <Float icon={<IconCircleCheck size={17} />} style={{ left: 2, bottom: 10 }}>All sizes match</Float>
    </div>
  );
}

const SLIDES = [
  { art: Art1, title: 'Your day, in order', text: 'The office books your visits. Today shows your route, drive times and what to check at each house.' },
  { art: Art2, title: 'Measure every item', text: "Each window and door shows the salesperson's size. Type yours — within 5mm counts as the same. Or upload your paper sheet." },
  { art: Art3, title: 'Sign and submit on site', text: 'Site checks, photos and the customer signs on your phone. The office sees it straight away.' },
];

export function Welcome() {
  const nav = useNavigate();
  const { step } = useParams();
  const n = Math.max(1, Math.min(4, Number(step) || 1));
  const [t, setT] = useState<Record<string, boolean>>({ face: true, alerts: true, route: true, loc: false });
  if (n === 4) return (
    <div className="auth">
      <StatusBar />
      <div className="form">
        <div className="between"><button className="icon-btn" aria-label="Back" onClick={() => nav('/welcome/3')}><IconChevronLeft size={22} /></button><span className="tiny muted">Almost done</span></div>
        <div className="vstack" style={{ gap: 8 }}><h1>Make it yours</h1><span className="lead">Turn these on now so the app works the way you do. You can change them later in Profile.</span></div>
        <div className="card flush"><div className="list">
          {([['face', IconFaceId, 'Face ID sign-in', 'Open the app with a glance'], ['alerts', IconBell, 'Visit alerts', 'When a visit is booked or moved'], ['route', IconRoute, "Tomorrow's route", 'Every working day at 6pm'], ['loc', IconMapPin, 'Location', 'For drive times between visits']] as [string, any, string, string][]).map(([k, I, l, s]) => (
            <div key={k} className="li"><span className="ic"><I size={20} /></span><span className="vstack grow" style={{ gap: 1 }}><span className="row-title">{l}</span><span className="row-sub">{s}</span></span><Switch on={t[k]} label={l} onChange={v => setT({ ...t, [k]: v })} /></div>
          ))}
        </div></div>
        <div className="card tight">
          <div className="between"><b style={{ fontSize: 14.5, fontWeight: 600 }}>Your access</b><Tag tone="jade">Surveyor</Tag></div>
          <div className="chips wrap" style={{ gap: 6 }}>{['Today', 'Final surveys', 'Inspections', 'Calendar', 'Messages'].map(c => <span key={c} className="tag grey plain" style={{ height: 30 }}><IconCheck size={13} style={{ display: 'inline' }} />{c}</span>)}</div>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 'auto' }} onClick={() => nav('/')}>Go to my day</button>
      </div>
    </div>
  );
  const s = SLIDES[n - 1];
  return (
    <div className="auth">
      <StatusBar />
      <div className="form" style={{ gap: 14 }}>
        <div className="between"><Logo /><button className="btn btn-ghost btn-sm" onClick={() => nav('/welcome/4')}>Skip</button></div>
        <s.art />
        <span className="eyebrow">Step {n} of 3</span>
        <h1 style={{ marginTop: -6 }}>{s.title}</h1>
        <span className="lead">{s.text}</span>
        <div className="between" style={{ marginTop: 'auto' }}>
          <div className="dots-nav">{[1, 2, 3].map(i => <i key={i} className={i === n ? 'on' : ''} />)}</div>
          <button className="btn btn-primary" style={{ minWidth: 130 }} onClick={() => nav(`/welcome/${n + 1}`)}>{n === 3 ? 'Get started' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}

export { IMG };
