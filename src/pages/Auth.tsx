// Sign in → security code (482193, 3 wrong codes locks the account) → short welcome tour.
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconMail, IconLock, IconEye, IconEyeOff, IconArrowRight, IconShieldLock, IconChevronLeft, IconRuler, IconRoute, IconSignature, IconBell, IconMapPin, IconCircleCheck } from '@tabler/icons-react';
import { StatusBar, Field, Switch, setSignedIn, useToast } from '../ui/kit';
import { IMG, me } from '../data/mock';

const CODE = '482193';

function Top({ title, sub, photo = IMG.house }: { title: string; sub: string; photo?: string }) {
  return (
    <div className="top">
      <div className="photo" style={{ backgroundImage: `url(${photo})` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}><StatusBar light /></div>
      <div className="hstack" style={{ gap: 10, marginBottom: 'auto', marginTop: 70 }}><img src="images/mark-glass.svg" alt="" style={{ width: 38, height: 38 }} onError={e => ((e.target as HTMLImageElement).src = 'images/mark.svg')} /><b style={{ fontSize: 20 }}>Jadeite</b><span className="tag glass" style={{ marginLeft: 'auto' }}>Surveyor</span></div>
      <h1 style={{ fontSize: 20, letterSpacing: -0.6, lineHeight: 1.15 }}>{title}</h1>
      <span style={{ color: '#cfe0db', fontSize: 14, marginTop: 6 }}>{sub}</span>
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
      <Top title="Welcome back" sub="Every size checked before anything is ordered." />
      <div className="form">
        <Field label="Email address"><div className="input-icon"><IconMail size={19} /><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email address" /></div></Field>
        <Field label="Password">
          <div className="input-icon" style={{ position: 'relative' }}><IconLock size={19} /><input className="input" type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} aria-label="Password" style={{ paddingRight: 48 }} />
            <button type="button" className="icon-btn ghost" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} style={{ position: 'absolute', right: 4, top: 5 }}>{show ? <IconEyeOff size={19} /> : <IconEye size={19} />}</button></div>
        </Field>
        <div className="between"><span className="hstack small" style={{ gap: 10 }}><Switch on={keep} onChange={setKeep} label="Keep me signed in" />Keep me signed in</span><button className="link" onClick={() => nav('/forgot')}>Forgot password?</button></div>
        <button className="btn btn-primary btn-block" disabled={!ok} onClick={() => { toast(`Code sent to •• ${me.phone.slice(-3)}`); nav('/code'); }}>Sign in<IconArrowRight size={18} /></button>
        <span className="tiny muted" style={{ textAlign: 'center', marginTop: 'auto' }}>Demo: any email · code 482193</span>
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
      <div className="form" style={{ paddingTop: 8 }}>
        <button className="icon-btn" aria-label="Back" onClick={() => nav('/login')}><IconChevronLeft size={22} /></button>
        <span className="tile" style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--tint)', color: 'var(--primary-dark)' }}><IconShieldLock size={30} /></span>
        <div className="vstack" style={{ gap: 6 }}><h1 style={{ fontSize: 20, letterSpacing: -0.5 }}>Enter your code</h1><span className="t2">We sent a 6-digit code by text to •• {me.phone.slice(-3)}.</span></div>
        <div className={`codebox ${bad ? 'bad' : ''}`}>
          {d.map((x, i) => <input key={i} ref={el => { refs.current[i] = el; }} inputMode="numeric" maxLength={6} value={x} aria-label={`Digit ${i + 1}`} onChange={e => put(i, e.target.value)} onKeyDown={e => { if (e.key === 'Backspace' && !d[i] && i > 0) refs.current[i - 1]?.focus(); if (e.key === 'Enter' && code.length === 6) verify(); }} />)}
        </div>
        {bad && <div className="alert err"><IconShieldLock size={17} />That code is not right. {3 - tries} {3 - tries === 1 ? 'try' : 'tries'} left before the account is locked.</div>}
        <button className="btn btn-primary btn-block" disabled={code.length < 6} onClick={verify}>Verify and continue</button>
        <button className="link" style={{ alignSelf: 'center' }} onClick={() => toast('A new code was sent')}>Send the code again</button>
        <span className="tiny muted" style={{ textAlign: 'center', marginTop: 'auto' }}>Demo code: 482193</span>
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
        <span className="ring warn"><IconLock size={46} /></span>
        <h2>Account locked</h2>
        <span className="t2">The code was wrong 3 times, so we locked your account to keep customer details safe. Please call the office on 0113 496 0000 to unlock it.</span>
        <a className="btn btn-outline btn-block" href="tel:01134960000">Call the office</a>
        <button className="btn btn-grey btn-block" onClick={() => nav('/login')}>Back to sign in</button>
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
      <div className="form" style={{ paddingTop: 8 }}>
        <button className="icon-btn" aria-label="Back" onClick={() => nav('/login')}><IconChevronLeft size={22} /></button>
        <div className="vstack" style={{ gap: 6 }}><h1 style={{ fontSize: 20, letterSpacing: -0.5 }}>Forgot your password?</h1><span className="t2">We will email you a link to set a new one.</span></div>
        {sent ? <div className="alert ok"><IconCircleCheck size={17} />Sent to {email}. The link works for 30 minutes.</div>
          : <Field label="Email address"><div className="input-icon"><IconMail size={19} /><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div></Field>}
        {sent ? <button className="btn btn-primary btn-block" onClick={() => nav('/login')}>Back to sign in</button> : <button className="btn btn-primary btn-block" disabled={!/.+@.+\..+/.test(email)} onClick={() => setSent(true)}>Send the link</button>}
      </div>
    </div>
  );
}

const SLIDES = [
  { icon: IconRoute, photo: IMG.house, title: 'Your day, in order', text: 'The office books your visits. You see them on Today with the route, drive times and what to check.' },
  { icon: IconRuler, photo: IMG.window, title: 'Measure every item', text: "Each window and door shows the salesperson's size. Type yours — within 5mm counts as the same. Or upload your paper sheet." },
  { icon: IconSignature, photo: IMG.door, title: 'Sign and submit on site', text: 'Site checks, photos and the customer signs on your phone. The office sees it straight away.' },
];

export function Welcome() {
  const nav = useNavigate();
  const { step } = useParams();
  const n = Math.max(1, Math.min(4, Number(step) || 1));
  const [noti, setNoti] = useState(true);
  const [loc, setLoc] = useState(true);
  if (n === 4) return (
    <div className="auth">
      <StatusBar />
      <div className="form" style={{ paddingTop: 20 }}>
        <div className="vstack" style={{ gap: 6 }}><h1 style={{ fontSize: 20, letterSpacing: -0.5 }}>Two quick things</h1><span className="t2">You can change these at any time in Profile.</span></div>
        <div className="card flat"><div className="hstack" style={{ gap: 12 }}><span className="tile" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--tint)', color: 'var(--primary-dark)' }}><IconBell size={22} /></span><div className="grow"><b>Notifications</b><div className="small muted">When a visit is booked or moved, and messages from the office.</div></div><Switch on={noti} onChange={setNoti} label="Notifications" /></div></div>
        <div className="card flat"><div className="hstack" style={{ gap: 12 }}><span className="tile" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--tint)', color: 'var(--primary-dark)' }}><IconMapPin size={22} /></span><div className="grow"><b>Location</b><div className="small muted">For directions and drive times between visits. Only while you use the app.</div></div><Switch on={loc} onChange={setLoc} label="Location" /></div></div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 'auto' }} onClick={() => nav('/')}>Go to my day<IconArrowRight size={18} /></button>
      </div>
    </div>
  );
  const s = SLIDES[n - 1];
  return (
    <div className="auth">
      <div style={{ position: 'relative', height: 420, flex: '0 0 auto', background: `url(${s.photo}) center/cover` }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,31,27,.35), rgba(11,31,27,0) 40%, #fff 100%)' }} />
        <div style={{ position: 'relative' }}><StatusBar light /></div>
        <button className="btn btn-sm" style={{ position: 'absolute', right: 16, top: 58, background: 'rgba(255,255,255,.85)' }} onClick={() => nav('/welcome/4')}>Skip</button>
        <span className="tile" style={{ position: 'absolute', left: 24, bottom: 10, width: 64, height: 64, borderRadius: 20, background: 'var(--primary)', color: 'var(--deep)', boxShadow: '0 10px 24px rgba(0,199,161,.35)' }}><s.icon size={30} /></span>
      </div>
      <div className="form" style={{ paddingTop: 20 }}>
        <span className="tiny b" style={{ color: 'var(--primary-dark)' }}>STEP {n} OF 3</span>
        <h1 style={{ fontSize: 20, letterSpacing: -0.5, lineHeight: 1.2 }}>{s.title}</h1>
        <span className="t2" style={{ fontSize: 15 }}>{s.text}</span>
        <div className="between" style={{ marginTop: 'auto' }}>
          <div className="dots-nav">{[1, 2, 3].map(i => <i key={i} className={i === n ? 'on' : ''} />)}</div>
          <button className="btn btn-primary" onClick={() => nav(`/welcome/${n + 1}`)}>{n === 3 ? 'Get started' : 'Next'}<IconArrowRight size={18} /></button>
        </div>
      </div>
    </div>
  );
}
