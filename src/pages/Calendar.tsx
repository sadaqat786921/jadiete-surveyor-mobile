// My calendar: the visits the office booked for me, and my time off. Synced with Outlook.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevronLeft, IconChevronRight, IconBeach, IconRefresh, IconBrandWindows, IconRuler, IconTool, IconTrash, IconCalendarEvent, IconMapPin } from '@tabler/icons-react';
import { Screen, Tag, Seg, Empty, Sheet, useToast } from '../ui/kit';
import { TimeOffSheet } from '../ui/sheets';
import { me } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate, mondayOf, Appt } from '../data/store';
import { useMyVisits, statusTone, dayLabel, startOf, town } from '../lib/visits';

export default function Calendar() {
  const nav = useNavigate();
  const toast = useToast();
  const { appts, set } = useStore();
  const visits = useMyVisits();
  const [day, setDay] = useState(TODAY);
  const [mode, setMode] = useState<'day' | 'list'>('day');
  const [off, setOff] = useState(false);
  const [del, setDel] = useState<Appt | null>(null);
  const [synced, setSynced] = useState('2 minutes ago');
  const mon = mondayOf(day);
  const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const mine = appts.filter(a => a.who === me.id && ['Survey', 'Snag visit', 'Time off'].includes(a.kind));
  const on = (d: string) => mine.filter(a => a.date === d).sort((a, b) => a.time.localeCompare(b.time));
  const visitFor = (a: Appt) => visits.find(v => (a.snag ? v.id === a.snag : v.e?.id === a.enq && v.kind === 'Final survey') && v.status !== 'No access');
  const open = (a: Appt) => { if (a.kind === 'Time off') { setDel(a); return; } if (a.status === 'Missed') { const m = visits.find(v => v.status === 'No access' && (v.e?.id === a.enq)); nav(m ? m.to : '/visits?show=noaccess'); return; } const v = visitFor(a); if (v) nav(v.kind === 'Final survey' && v.status === 'Submitted' ? `/report/${v.id}` : v.to); else toast('This visit is no longer booked for you'); };
  const Item = ({ a }: { a: Appt }) => {
    const v = a.kind !== 'Time off' ? visitFor(a) : undefined;
    const isOff = a.kind === 'Time off';
    const col = isOff ? '#9aa8a5' : a.kind === 'Snag visit' ? '#e0a100' : '#0b6e5c';
    const status = a.status === 'Missed' ? 'Not in' : v?.status || a.status;
    return (
      <button className="card tight" style={{ flex: 1, textAlign: 'left', borderLeft: `4px solid ${col}`, background: isOff ? '#f1f4f3' : '#fff', boxShadow: isOff ? 'none' : undefined, opacity: a.status === 'Missed' ? 0.75 : 1 }} onClick={() => open(a)}>
        <div className="between"><b style={{ fontSize: 14 }}>{isOff ? `Time off · ${a.customer}` : a.customer}</b>{isOff ? <IconTrash size={16} color="#6b7a78" /> : <Tag tone={a.status === 'Missed' ? 'err' : statusTone[(v?.status || 'Booked') as keyof typeof statusTone] || 'jade'}>{status}</Tag>}</div>
        <span className="tiny muted hstack" style={{ gap: 5 }}>{isOff ? <><IconBeach size={13} />{a.note || 'Off'} · {a.time}</> : <>{a.kind === 'Snag visit' ? <IconTool size={13} /> : <IconRuler size={13} />}{a.kind === 'Snag visit' ? 'Inspection' : 'Final survey'} · {a.time}</>}</span>
        {!isOff && a.address && <span className="tiny t2 hstack" style={{ gap: 5 }}><IconMapPin size={13} />{a.address}</span>}
      </button>
    );
  };
  const upcoming = Array.from({ length: 21 }, (_, i) => addDays(TODAY, i)).filter(d => on(d).length);
  return (
    <Screen tabs header={<>
      <div className="hdr-lg"><h1>Calendar</h1><button className="btn btn-grey btn-sm" onClick={() => { setDay(TODAY); setMode('day'); }}>Today</button></div>
      <div style={{ padding: '0 16px 10px', display: 'grid', gap: 12 }}>
        <Seg value={mode} onChange={setMode} items={[{ id: 'day', label: 'Week' }, { id: 'list', label: 'List' }]} />
        {mode === 'day' && <>
          <div className="between">
            <button className="icon-btn" aria-label="Previous week" onClick={() => setDay(addDays(day, -7))}><IconChevronLeft size={20} /></button>
            <b style={{ fontSize: 15 }}>{fmtDate(mon, { day: 'numeric', month: 'short' })} – {fmtDate(addDays(mon, 6), { day: 'numeric', month: 'short', year: 'numeric' })}</b>
            <button className="icon-btn" aria-label="Next week" onClick={() => setDay(addDays(day, 7))}><IconChevronRight size={20} /></button>
          </div>
          <div className="week">
            {week.map(d => (
              <button key={d} className={`${d === day ? 'on' : ''} ${d === TODAY ? 'today' : ''}`} onClick={() => setDay(d)} aria-label={fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}>
                {fmtDate(d, { weekday: 'short' }).slice(0, 3)}<b>{Number(d.slice(8))}</b>
                <span className="dots">{on(d).slice(0, 3).map(a => <i key={a.id} className={a.kind === 'Time off' ? 'o' : a.kind === 'Snag visit' ? 'w' : ''} />)}</span>
              </button>
            ))}
          </div>
        </>}
      </div>
    </>}>
      <div className="pad" style={{ paddingTop: 4, paddingBottom: 90 }}>
        {mode === 'day' ? <>
          <div className="between"><b style={{ fontSize: 16 }}>{dayLabel(day)}</b><span className="tiny muted">{on(day).filter(a => a.kind !== 'Time off').length} visits</span></div>
          {on(day).length === 0 && <Empty icon={<IconCalendarEvent size={24} />} title={new Date(day + 'T12:00:00').getDay() === 0 ? 'Sunday · not a working day' : 'Nothing booked'} sub="The office books your visits." />}
          {on(day).map(a => <div key={a.id} className="agenda"><span className="tm">{startOf(a.time)}<small>{a.time.split('– ')[1] || ''}</small></span><Item a={a} /></div>)}
        </> : <>
          {upcoming.length === 0 && <Empty icon={<IconCalendarEvent size={24} />} title="Nothing booked" sub="The office books your visits." />}
          {upcoming.map(d => (
            <div key={d} className="vstack" style={{ gap: 8 }}>
              <span className="tiny b muted" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{dayLabel(d)}</span>
              {on(d).map(a => <div key={a.id} className="agenda"><span className="tm" style={{ paddingTop: 12 }}>{startOf(a.time)}</span><Item a={a} /></div>)}
            </div>
          ))}
        </>}
        <div className="card tight flat">
          <div className="hstack" style={{ gap: 10 }}><span className="tile" style={{ width: 36, height: 36, borderRadius: 10, background: '#e8f1fb', color: '#0b6e5c' }}><IconBrandWindows size={19} /></span><span className="vstack grow" style={{ gap: 0 }}><b className="small">Synced with Outlook</b><span className="tiny muted">{synced} · busy times stop the office booking you</span></span><button className="icon-btn" aria-label="Sync now" onClick={() => { setSynced('just now'); toast('Synced with Outlook'); }}><IconRefresh size={18} /></button></div>
        </div>
      </div>
      <button className="fab" onClick={() => setOff(true)}><IconBeach size={19} />Time off</button>
      {off && <TimeOffSheet day={day} onClose={() => setOff(false)} />}
      {del && (
        <Sheet title="Remove this time off?" sub={`${del.customer} · ${fmtDate(del.date)} · ${del.time}`} onClose={() => setDel(null)}
          footer={<><button className="btn btn-grey" onClick={() => setDel(null)}>Keep it</button><button className="btn btn-danger" onClick={() => { set('appts', as => as.filter(x => x.id !== del.id)); toast('Time off removed'); setDel(null); }}><IconTrash size={18} />Remove</button></>}>
          <span className="t2">The office will be able to book visits for you then again.</span>
        </Sheet>
      )}
    </Screen>
  );
}

export { town };
