// Mobile building blocks: the phone frame, status bar, headers, tab bar, bottom sheets, toasts and small controls.
import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  IconChevronLeft, IconX, IconCircleCheck, IconHome, IconClipboardList, IconCalendarEvent, IconMessageCircle, IconUser,
  IconCheck, IconEraser, IconWifi, IconBattery3, IconAntennaBars5, IconCamera, IconTrash, IconRefresh, IconLogin2,
  IconRuler, IconTool, IconBell, IconSearch, IconPlayerPlay,
} from '@tabler/icons-react';
import { useStore, TODAY } from '../data/store';
import { useMyVisits, isOpenVisit, needsReply, useConversations, img } from '../lib/visits';

/* ---------- Toasts ---------- */
const ToastCtx = createContext<(m: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
const ScreenCtx = createContext<HTMLElement | null>(null);

/* ---------- Auth (demo) ---------- */
const AUTH = 'jadeite-surveyor-mobile-auth';
export const isSignedIn = () => { try { return sessionStorage.getItem(AUTH) === '1'; } catch { return false; } };
export const setSignedIn = (v: boolean) => { try { v ? sessionStorage.setItem(AUTH, '1') : sessionStorage.removeItem(AUTH); } catch {} };

/** The phone on a desktop (375 × 812 screen), or the whole screen on a real phone. */
export function Device({ children }: { children: React.ReactNode }) {
  const [native] = useState(() => window.innerWidth < 520);
  const [scale, setScale] = useState(1);
  const [screenEl, setScreenEl] = useState<HTMLElement | null>(null);
  const [toast, setToast] = useState<{ m: string; k: number } | null>(null);
  const nav = useNavigate();
  const { reset } = useStore();
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('native', native);
    const fit = () => setScale(native ? 1 : Math.min(1, (window.innerHeight - 32) / 832));
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, [native]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2800); return () => clearTimeout(t); }, [toast]);
  const show = (m: string) => setToast({ m, k: Date.now() });
  const jump = (to: string) => { if (to !== '/login') setSignedIn(true); nav(to); };
  return (
    <ToastCtx.Provider value={show}>
      <div className="stage">
        <aside className="side">
          <div className="brand"><img src="images/mark.svg" alt="" /><b>Jadeite</b></div>
          <h1>Surveyor app</h1>
          <p>The surveyor's phone app for final surveys and aftercare inspections. Same records as the Office Admin, Sales and Surveyor portals. Every button works.</p>
          <div className="jump">
            {([['Sign in', '/login', IconLogin2], ['Today', '/', IconHome], ['Final survey · Mrs Hughes', '/visit/EN-2279', IconRuler], ['Final survey · Mr & Mrs Collins', '/visit/EN-2274', IconPlayerPlay], ['Inspection · Mrs Cooper', '/inspection/SN-127', IconTool], ['My visits', '/visits', IconClipboardList], ['Calendar', '/calendar', IconCalendarEvent], ['Messages', '/messages', IconMessageCircle], ['Notifications', '/notifications', IconBell], ['Search', '/search', IconSearch], ['Profile', '/profile', IconUser]] as [string, string, any][]).map(([l, to, I]) => <button key={l} onClick={() => jump(to)}><I size={17} />{l}</button>)}
            <button onClick={() => { reset(); show('Demo data reset'); nav('/'); }}><IconRefresh size={17} />Reset demo data</button>
          </div>
          <span className="note">Demo sign-in: any email · code 482193 · demo date Fri 16 Oct 2026</span>
        </aside>
        <div className="device-wrap" style={{ transform: `scale(${scale})`, marginBottom: native ? 0 : -(1 - scale) * 832 }}>
          <div className="device">
            <div className="screen" ref={setScreenEl}>
              <span className="island" />
              <ScreenCtx.Provider value={screenEl}>{children}</ScreenCtx.Provider>
              {toast && <div key={toast.k} className="toast" role="status"><IconCircleCheck size={18} />{toast.m}</div>}
              <span className="homebar" />
            </div>
          </div>
        </div>
      </div>
    </ToastCtx.Provider>
  );
}

export function StatusBar({ light }: { light?: boolean }) {
  return (
    <div className={`statusbar ${light ? 'light' : ''}`}>
      <span>9:41</span>
      <span className="icons"><IconAntennaBars5 size={17} /><IconWifi size={17} /><IconBattery3 size={22} /></span>
    </div>
  );
}

/** One screen: status bar, optional header, scrolling body, optional sticky footer and tab bar. */
export function Screen({ header, children, foot, tabs, dark, bg, top, scrollRef }: { header?: React.ReactNode; children: React.ReactNode; foot?: React.ReactNode; tabs?: boolean; dark?: boolean; bg?: string; top?: React.ReactNode; scrollRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div className="app" style={{ background: bg }}>
      {top ? null : <div style={{ background: dark ? 'var(--deep)' : bg || 'var(--bg)' }}><StatusBar light={dark} /></div>}
      <div className="page">
        {top}
        {header}
        <div className="scroll" ref={scrollRef}>{children}</div>
        {foot && <div className="foot">{foot}</div>}
        {tabs && <TabBar />}
      </div>
    </div>
  );
}

export function Header({ title, sub, back, right, white, onBack }: { title?: React.ReactNode; sub?: React.ReactNode; back?: string | boolean; right?: React.ReactNode; white?: boolean; onBack?: () => void }) {
  const nav = useNavigate();
  return (
    <div className={`hdr ${white ? 'white' : ''}`}>
      {back !== undefined && back !== false && <button className="icon-btn" aria-label="Back" onClick={() => (onBack ? onBack() : typeof back === 'string' ? nav(back) : nav(-1))}><IconChevronLeft size={22} /></button>}
      <div className="ttl">{typeof title === 'string' ? <b>{title}</b> : title}{sub && <span>{sub}</span>}</div>
      {right}
    </div>
  );
}

export function TabBar() {
  const visits = useMyVisits();
  const convos = useConversations();
  const today = visits.filter(v => v.date === TODAY && isOpenVisit(v)).length;
  const open = visits.filter(isOpenVisit).length;
  const replies = convos.filter(r => needsReply(r.e)).length;
  const tabs: [string, string, any, number, boolean?][] = [['/', 'Today', IconHome, today, true], ['/visits', 'Visits', IconClipboardList, open], ['/calendar', 'Calendar', IconCalendarEvent, 0], ['/messages', 'Messages', IconMessageCircle, replies], ['/profile', 'Profile', IconUser, 0]];
  return (
    <nav className="tabbar">
      {tabs.map(([to, l, I, n, end]) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ic"><I size={23} stroke={1.8} /></span>{l}{n ? <span className="cnt">{n}</span> : null}
        </NavLink>
      ))}
    </nav>
  );
}

/** A pop-up that slides up from the bottom of the phone. */
export function Sheet({ title, sub, onClose, children, footer, full, icon }: { title: string; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; full?: boolean; icon?: React.ReactNode }) {
  const el = useContext(ScreenCtx);
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  const node = (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className={`sheet ${full ? 'full' : ''}`} role="dialog" aria-label={title}>
        <span className="handle" />
        <div className="sh">
          {icon}
          <div className="grow"><b>{title}</b>{sub && <span>{sub}</span>}</div>
          <button className="icon-btn" aria-label="Close" onClick={onClose} style={{ width: 34, height: 34, flex: '0 0 34px' }}><IconX size={18} /></button>
        </div>
        <div className="sb">{children}</div>
        {footer && <div className="sf">{footer}</div>}
      </div>
    </>
  );
  return el ? createPortal(node, el) : node;
}

/* ---------- Small controls ---------- */
export const Tag = ({ tone = 'jade', children, icon }: { tone?: string; children: React.ReactNode; icon?: React.ReactNode }) => <span className={`tag ${tone}`}>{icon}{children}</span>;
export const Avatar = ({ i, size = 40, bg = 'var(--tint)', fg = 'var(--primary-dark)' }: { i: string; size?: number; bg?: string; fg?: string }) => <span className="avatar" style={{ width: size, height: size, background: bg, color: fg, fontSize: Math.min(20, Math.max(11, Math.round(size * 0.34))) }}>{i}</span>;
export const Field = ({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) => <div className="field"><label>{label}</label>{children}{hint && <span className="hint">{hint}</span>}</div>;
export const Check = ({ on, onChange, label, disabled }: { on: boolean; onChange?: (v: boolean) => void; label: React.ReactNode; disabled?: boolean }) => (
  <button type="button" className="check" disabled={disabled} onClick={() => onChange?.(!on)} aria-pressed={on}><span className={`box ${on ? 'on' : ''}`}>{on && <IconCheck size={15} stroke={3} />}</span><span style={{ flex: 1 }}>{label}</span></button>
);
export const Switch = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) => <button type="button" className={`switch ${on ? 'on' : ''}`} aria-pressed={on} aria-label={label} onClick={() => onChange(!on)} />;
export function Seg<T extends string>({ value, onChange, items }: { value: T; onChange: (v: any) => void; items: { id: T; label: React.ReactNode }[] }) {
  return <div className="seg" role="tablist">{items.map(it => <button key={it.id} role="tab" aria-selected={value === it.id} className={value === it.id ? 'on' : ''} onClick={() => onChange(it.id)}>{it.label}</button>)}</div>;
}
export const Empty = ({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) => <div className="empty"><span className="ic">{icon}</span><b>{title}</b>{sub && <span className="small">{sub}</span>}{action}</div>;
export const Thumb = ({ src, size = 48, r = 12 }: { src: string; size?: number; r?: number }) => <img className="thumb" src={img(src)} alt="" style={{ width: size, height: size, borderRadius: r }} />;

export function Steps({ at, done, labels = ['Booked', 'On my way', 'On site', 'Submitted'], times = [] }: { at: number; done?: boolean; labels?: string[]; times?: (string | undefined)[] }) {
  return (
    <div className="steps">
      {labels.map((l, i) => {
        const isDone = i < at || (done && i === labels.length - 1);
        const cls = isDone ? 'done' : i === at ? 'now' : '';
        return (
          <React.Fragment key={l}>
            {i > 0 && <span className={`ln ${i <= at || done ? 'done' : ''}`} />}
            <span className={`s ${cls}`}><i>{isDone ? <IconCheck size={14} stroke={3} /> : i + 1}</i><span>{l}{times[i] ? <><br />{times[i]}</> : ''}</span></span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Customer signature, drawn with a finger. */
export function SignaturePad({ value, onChange, name }: { value: boolean; onChange: (v: boolean) => void; name?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const W = 680, H = 300;
  const ctx = () => { const c = ref.current!.getContext('2d')!; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#0f1414'; return c; };
  const pos = (ev: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * H]; };
  const sample = () => { const c = ctx(); c.font = 'italic 64px cursive'; c.fillStyle = '#0f1414'; c.fillText(name || 'Signed', 40, 180); onChange(true); };
  useEffect(() => { if (value) sample(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return (
    <div className="vstack" style={{ gap: 8 }}>
      <canvas ref={ref} width={W} height={H} className="sig-pad" aria-label="Customer signature"
        onPointerDown={ev => { drawing.current = true; const [x, y] = pos(ev); const c = ctx(); c.beginPath(); c.moveTo(x, y); (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId); }}
        onPointerMove={ev => { if (!drawing.current) return; const [x, y] = pos(ev); const c = ctx(); c.lineTo(x, y); c.stroke(); if (!value) onChange(true); }}
        onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} />
      <div className="between small">
        <span className="muted">{value ? 'Signed' : 'Ask the customer to sign in the box'}</span>
        <span className="hstack" style={{ gap: 14 }}>
          {!value && <button type="button" className="link" onClick={sample}>Use a sample signature</button>}
          <button type="button" className="link" onClick={() => { ref.current!.getContext('2d')!.clearRect(0, 0, W, H); onChange(false); }}><IconEraser size={15} />Clear</button>
        </span>
      </div>
    </div>
  );
}

/** Photos taken on site. In the demo each tap adds a property photo. */
const SAMPLE = ['house', 'window', 'door', 'bifold', 'roof', 'orangery'];
export function PhotoGrid({ n, onAdd, onRemove, disabled, seed = 0, max = 9 }: { n: number; onAdd?: () => void; onRemove?: () => void; disabled?: boolean; seed?: number; max?: number }) {
  return (
    <div className="pgrid">
      {Array.from({ length: Math.min(n, max) }, (_, i) => (
        <div key={i} className="ph" style={{ backgroundImage: `url(${img(SAMPLE[(i + seed) % SAMPLE.length])})` }}>
          <b>{i + 1}</b>
          {onRemove && i === Math.min(n, max) - 1 && !disabled && <button className="x" aria-label="Remove photo" onClick={onRemove}><IconTrash size={13} /></button>}
        </div>
      ))}
      {n > max && <div className="ph" style={{ background: 'var(--deep)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 600 }}>+{n - max}</div>}
      {!disabled && onAdd && <button type="button" className="add" onClick={onAdd}><IconCamera size={24} />Take photo</button>}
    </div>
  );
}
