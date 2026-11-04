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
  const sub = v.kind === 'Final survey' ? plural(v.items, 'frame') : v.snag ? v.snag.title : 'Inspection';
  return (
    <Link to={to} className="li" style={{ alignItems: 'center' }}>
      <Thumb src={v.photo} size={52} />
      <span className="vstack grow" style={{ gap: 3 }}>
        <span className="row-title ell">{v.customer}</span>
        <span className="row-sub ell">{startOf(v.time)} · {town(v.address) || '—'} · {sub}</span>
        <span className="hstack" style={{ gap: 6 }}>
          <Tag tone={statusTone[v.status]}>{v.status === 'No access' ? 'Not in' : v.status}</Tag>
          {v.status === 'Submitted' && v.kind === 'Final survey' ? (v.changed ? <Tag tone="warn">{plural(v.changed, 'size')} changed</Tag> : <Tag tone="ok">Sizes match</Tag>)
            : v.moveAsked && isOpenVisit(v) ? <Tag tone="warn">Move asked</Tag> : v.kind === 'Inspection' ? <Tag tone="grey">Inspection</Tag> : null}
        </span>
      </span>
      <IconChevronRight size={18} className="chev" />
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
      <div className="hdr-lg"><h1>My visits</h1><span className="outline-pill">{base.filter(isOpenVisit).length} to do</span></div>
      <div style={{ padding: '0 20px 12px', display: 'grid', gap: 12 }}>
        <div className="input-icon search"><IconSearch size={19} /><input className="input" placeholder="Search customer, town or job" value={q} onChange={e => setQ(e.target.value)} /></div>
        <Seg value={kind} onChange={setKind} items={[{ id: 'all', label: 'All' }, { id: 'sv', label: <><IconRuler size={15} />Surveys</> }, { id: 'ins', label: <><IconTool size={15} />Inspections</> }]} />
        <div className="chips" style={{ margin: '0 -20px', padding: '2px 20px' }}>{FILTERS.map(([id, l, p]) => <button key={id} className={`chip ${f === id ? 'on' : ''}`} onClick={() => setSp({ show: id })}>{l}<span className="n">{base.filter(p).length}</span></button>)}</div>
      </div>
    </>}>
      <div className="pad" style={{ paddingTop: 4 }}>
        {groups.map(([d, vs]) => (
          <React.Fragment key={d}>
            <div className="sec"><h3>{dayLabel(d)}</h3><span className="tiny muted">{plural(vs.length, 'visit')}</span></div>
            <div className="card flush"><div className="list">{vs.map(v => <VisitRow key={v.id + v.status} v={v} />)}</div></div>
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
    <Screen header={<div className="hdr"><div className="input-icon search grow"><IconSearch size={19} /><input className="input" autoFocus placeholder="Search my visits" value={q} onChange={e => setQ(e.target.value)} aria-label="Search my visits" /></div><button className="link" onClick={() => nav(-1)}>Cancel</button></div>}>
      <div className="pad">
        {!q.trim() && <>
          <span className="eyebrow" style={{ color: 'var(--muted)' }}>Try</span>
          <div className="chips wrap">{['Hughes', 'Harrogate', 'Cooper', 'Grant', 'Inspection'].map(s => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
        </>}
        {res.length > 0 && <div className="card flush"><div className="list">{res.map(v => <VisitRow key={v.id + v.status} v={v} />)}</div></div>}
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
  const col: Record<string, [string, string]> = { err: ['#fdeeee', '#c43d3d'], warn: ['#fdf5e1', '#a87600'], ok: ['#e9f7ef', '#1a8f50'], jade: ['#e8f8f3', '#0b6e5c'] };
  return (
    <Screen header={<Header back title="Notifications" sub={`${alerts.length} for you`} right={<button className="icon-btn" aria-label="Mark all as read" onClick={() => { setRead(alerts.map(a => a.id)); toast('All marked as read'); }}><IconChecks size={19} /></button>} />}>
      <div className="pad">
        {alerts.length === 0 && <Empty icon={<IconBell size={24} />} title="Nothing new" />}
        <div className="card flush"><div className="list">
          {alerts.map(a => { const I = icon[a.icon]; const [bg, fg] = col[a.tone] || col.jade; const unread = !read.includes(a.id); return (
            <button key={a.id} className="li" style={{ alignItems: 'flex-start' }} onClick={() => { setRead(r => [...r, a.id]); nav(a.to); }}>
              <span className="tile" style={{ width: 42, height: 42, borderRadius: '50%', background: bg, color: fg }}><I size={19} /></span>
              <span className="vstack grow" style={{ gap: 2 }}><span className="row-title" style={{ fontWeight: unread ? 600 : 500 }}>{a.title}</span><span className="row-sub">{a.sub}</span></span>
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
          <span className="tile" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--err-bg)', color: 'var(--err)' }}><IconDoorOff size={28} /></span>
          <b style={{ fontSize: 18, fontWeight: 600 }}>The customer was not in</b>
          <span className="small t2">{s.reason}</span>
          <Tag tone="grey">Sent back to the office to rebook</Tag>
        </div>
        <div className="card" style={{ padding: '6px 20px' }}><div className="kvs">
          <div><span>Customer</span><b>{s.customer}</b></div>
          <div><span>When</span><b>{s.date} · {startOf(s.time)}</b></div>
          <div><span>Address</span><b>{s.address}</b></div>
        </div></div>
        <div className="alert info"><IconCalendarEvent size={17} />When the office books a new date, it comes back to you in Today and your calendar.</div>
      </div>
    </Screen>
  );
}
