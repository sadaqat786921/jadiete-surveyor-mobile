// My visits (final surveys and inspections), search, notifications, and a visit where the customer was not in.
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IconSearch, IconClock, IconMapPin, IconChevronRight, IconClipboardList, IconBell, IconAlertTriangle, IconCalendarEvent, IconRuler, IconTool, IconDoorOff, IconX, IconChecks } from '@tabler/icons-react';
import { Screen, Header, Tag, Thumb, Empty, Seg, useToast } from '../ui/kit';
import { TODAY, fmtDate, useStore } from '../data/store';
import { useMyVisits, useAlerts, isOpenVisit, statusTone, Visit, startOf, town, plural, dayLabel } from '../lib/visits';

const FILTERS: [string, string, (v: Visit) => boolean][] = [
  ['todo', 'To do', isOpenVisit],
  ['today', 'Today', v => v.date === TODAY && v.status !== 'No access'],
  ['progress', 'Not finished', v => v.status === 'On site'],
  ['moved', 'Move asked', v => !!v.moveAsked && isOpenVisit(v)],
  ['done', 'Done', v => v.status === 'Submitted'],
  ['noaccess', 'Not in', v => v.status === 'No access'],
  ['all', 'All', () => true],
];

export function VisitRow({ v }: { v: Visit }) {
  const to = v.kind === 'Final survey' && v.status === 'Submitted' ? `/report/${v.id}` : v.to;
  return (
    <Link to={to} className={`vcard ${v.kind === 'Inspection' ? 'k-ins' : 'k-sv'}`}>
      <div className="top">
        <Thumb src={v.photo} size={52} />
        <div className="vstack grow" style={{ gap: 3 }}>
          <div className="between"><b className="ell" style={{ fontSize: 15 }}>{v.customer}</b><Tag tone={statusTone[v.status]}>{v.status === 'No access' ? 'Not in' : v.status}</Tag></div>
          <span className="small t2 hstack" style={{ gap: 5 }}><IconMapPin size={14} />{town(v.address) || '—'}</span>
          <span className="tiny muted">{v.kind}{v.kind === 'Final survey' ? ` · ${plural(v.items, 'frame')}` : v.snag ? ` · ${v.snag.title}` : ''}</span>
        </div>
      </div>
      <div className="meta">
        <span className="hstack" style={{ gap: 5 }}><IconClock size={14} />{v.date === TODAY ? 'Today' : fmtDate(v.date)} · {startOf(v.time)}</span>
        {v.status === 'Submitted' && v.kind === 'Final survey' ? (v.changed ? <Tag tone="warn">{v.changed} size changed</Tag> : <Tag tone="ok">All sizes match</Tag>)
          : v.moveAsked && isOpenVisit(v) ? <Tag tone="warn">Waiting for the office</Tag>
          : v.status === 'No access' ? <span className="tiny">Office rebooks</span>
          : <span className="hstack b" style={{ color: 'var(--primary-dark)', gap: 2 }}>{v.status === 'On site' ? 'Carry on' : 'Open'}<IconChevronRight size={15} /></span>}
      </div>
    </Link>
  );
}

export default function Visits() {
  const visits = useMyVisits();
  const [sp, setSp] = useSearchParams();
  const f = sp.get('show') || 'todo';
  const [kind, setKind] = useState<'all' | 'sv' | 'ins'>((sp.get('kind') as any) || 'all');
  const [q, setQ] = useState('');
  const pass = FILTERS.find(x => x[0] === f)?.[2] || (() => true);
  const base = visits.filter(v => (kind === 'all' || (kind === 'sv' ? v.kind === 'Final survey' : v.kind === 'Inspection')) && (v.customer + v.address + (v.e?.jobId || '')).toLowerCase().includes(q.toLowerCase()));
  const list = base.filter(pass);
  const sorted = f === 'done' || f === 'noaccess' || f === 'all' ? [...list].reverse() : list;
  const groups = useMemo(() => { const g: [string, Visit[]][] = []; sorted.forEach(v => { const last = g[g.length - 1]; if (last && last[0] === v.date) last[1].push(v); else g.push([v.date, [v]]); }); return g; }, [sorted]);
  return (
    <Screen tabs header={<>
      <div className="hdr-lg"><h1>My visits</h1></div>
      <div style={{ padding: '0 16px 10px', display: 'grid', gap: 10 }}>
        <div className="input-icon"><IconSearch size={18} /><input className="input" style={{ height: 44, fontSize: 15 }} placeholder="Search customer, town or job" value={q} onChange={e => setQ(e.target.value)} /></div>
        <Seg value={kind} onChange={setKind} items={[{ id: 'all', label: 'All' }, { id: 'sv', label: <><IconRuler size={15} />Surveys</> }, { id: 'ins', label: <><IconTool size={15} />Inspections</> }]} />
        <div className="chips" style={{ margin: '0 -16px', padding: '0 16px' }}>{FILTERS.map(([id, l, p]) => <button key={id} className={`chip ${f === id ? 'on' : ''}`} onClick={() => setSp({ show: id })}>{l}<span className="n">{base.filter(p).length}</span></button>)}</div>
      </div>
    </>}>
      <div className="pad" style={{ paddingTop: 4 }}>
        {groups.map(([d, vs]) => (
          <React.Fragment key={d}>
            <span className="tiny b muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{dayLabel(d)}</span>
            {vs.map(v => <VisitRow key={v.id + v.status} v={v} />)}
          </React.Fragment>
        ))}
        {list.length === 0 && <Empty icon={<IconClipboardList size={26} />} title="Nothing here" sub="Try another filter." />}
      </div>
    </Screen>
  );
}

export function Search() {
  const nav = useNavigate();
  const visits = useMyVisits();
  const [q, setQ] = useState('');
  const res = q.trim() ? visits.filter(v => (v.customer + v.address + (v.e?.jobId || '') + v.kind + (v.e?.product || '')).toLowerCase().includes(q.toLowerCase())) : [];
  return (
    <Screen header={<div className="hdr"><div className="input-icon grow"><IconSearch size={18} /><input className="input" autoFocus style={{ height: 44, fontSize: 15 }} placeholder="Search my visits" value={q} onChange={e => setQ(e.target.value)} aria-label="Search my visits" /></div><button className="link" onClick={() => nav(-1)}>Cancel</button></div>}>
      <div className="pad">
        {!q.trim() && <>
          <span className="tiny b muted">TRY</span>
          <div className="chips wrap">{['Hughes', 'Harrogate', 'Cooper', 'Grant', 'Inspection'].map(s => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
        </>}
        {res.map(v => <VisitRow key={v.id + v.status} v={v} />)}
        {q.trim() && res.length === 0 && <Empty icon={<IconSearch size={24} />} title="No visits found" sub="Search by customer name, town or job number." />}
      </div>
    </Screen>
  );
}

export function Notifications() {
  const nav = useNavigate();
  const alerts = useAlerts();
  const [read, setRead] = useState<string[]>([]);
  const toast = useToast();
  const icon = { survey: IconRuler, tool: IconTool, alert: IconAlertTriangle, cal: IconCalendarEvent, msg: IconBell };
  const col: Record<string, [string, string]> = { err: ['#fdeeee', '#d64545'], warn: ['#fdf3d9', '#8a6400'], ok: ['#e3f6ec', '#1f9d5b'], jade: ['#ebf7f3', '#0b6e5c'] };
  return (
    <Screen header={<Header back title="Notifications" right={<button className="icon-btn" aria-label="Mark all as read" onClick={() => { setRead(alerts.map(a => a.id)); toast('All marked as read'); }}><IconChecks size={19} /></button>} />}>
      <div className="pad">
        {alerts.length === 0 && <Empty icon={<IconBell size={24} />} title="Nothing new" />}
        <div className="card flush"><div className="list">
          {alerts.map(a => { const I = icon[a.icon]; const [bg, fg] = col[a.tone] || col.jade; const unread = !read.includes(a.id); return (
            <button key={a.id} className="li" style={{ alignItems: 'flex-start' }} onClick={() => { setRead(r => [...r, a.id]); nav(a.to); }}>
              <span className="tile" style={{ width: 40, height: 40, borderRadius: 12, background: bg, color: fg }}><I size={19} /></span>
              <span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 14, fontWeight: unread ? 600 : 500 }}>{a.title}</b><span className="tiny muted">{a.sub}</span></span>
              {unread && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)', marginTop: 6 }} />}
            </button>
          ); })}
        </div></div>
      </div>
    </Screen>
  );
}

/** A visit where nobody was in: it went back to the office to rebook. */
export function Missed() {
  const { id } = useParams();
  const { surveys } = useStore();
  const s = (surveys as any[]).find(x => x.id === id);
  if (!s) return <Screen header={<Header back="/visits" title="Visit" />}><Empty icon={<IconX size={24} />} title="Visit not found" /></Screen>;
  return (
    <Screen header={<Header back title={s.customer} sub={`${s.kind || 'Final survey'} · ${s.date}`} />}>
      <div className="pad">
        <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <span className="tile" style={{ width: 64, height: 64, borderRadius: '50%', background: '#fdeeee', color: 'var(--err)' }}><IconDoorOff size={30} /></span>
          <b style={{ fontSize: 18 }}>The customer was not in</b>
          <span className="small t2">{s.reason}</span>
          <Tag tone="grey">Sent back to the office to rebook</Tag>
        </div>
        <div className="kv">
          <div><span>Customer</span><b>{s.customer}</b></div>
          <div><span>When</span><b>{s.date} · {startOf(s.time)}</b></div>
          <div style={{ gridColumn: 'span 2' }}><span>Address</span><b>{s.address}</b></div>
        </div>
        <div className="alert info"><IconCalendarEvent size={17} />When the office books a new date, it comes back to you in Today and your calendar.</div>
      </div>
    </Screen>
  );
}
