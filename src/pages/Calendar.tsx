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
    const col = isOff ? '#6b7a78' : a.kind === 'Snag visit' ? '#a87600' : '#0b6e5c';
    const status = a.status === 'Missed' ? 'Not in' : v?.status || a.status;
    return (
      <button className="card tight" style={{ flex: 1, textAlign: 'left', flexDirection: 'row', alignItems: 'center', gap: 12, background: isOff ? 'transparent' : '#fff', boxShadow: isOff ? 'inset 0 0 0 1.5px #dfe6e3' : undefined, opacity: a.status === 'Missed' ? 0.7 : 1 }} onClick={() => open(a)}>
        <span className="icircle sm" style={{ background: isOff ? 'var(--field)' : a.kind === 'Snag visit' ? 'var(--warn-bg)' : 'var(--tint)', color: col }}>{isOff ? <IconBeach size={17} /> : a.kind === 'Snag visit' ? <IconTool size={17} /> : <IconRuler size={17} />}</span>
        <span className="vstack grow" style={{ gap: 2 }}>
          <span className="row-title ell">{isOff ? `Time off · ${a.customer}` : a.customer}</span>
          <span className="row-sub ell">{isOff ? `${a.note || 'Off'} · ${a.time}` : `${a.kind === 'Snag visit' ? 'Inspection' : 'Final survey'} · ${a.address ? a.address.split(', ').slice(-1)[0] : ''}`}</span>
        </span>
        {isOff ? <IconTrash size={17} color="#a3b0ad" /> : <Tag tone={a.status === 'Missed' ? 'err' : statusTone[(v?.status || 'Booked') as keyof typeof statusTone] || 'jade'}>{status}</Tag>}
      </button>
    );
  };
  const upcoming = Array.from({ length: 21 }, (_, i) => addDays(TODAY, i)).filter(d => on(d).length);
  return (
    <Screen tabs header={<>
      <div className="hdr-lg"><h1>Calendar</h1><button className="btn btn-outline btn-xs" onClick={() => { setDay(TODAY); setMode('day'); }}>Today</button></div>
      <div style={{ padding: '0 20px 12px', display: 'grid', gap: 12 }}>
        <Seg value={mode} onChange={setMode} items={[{ id: 'day', label: 'Week' }, { id: 'list', label: 'List' }]} />
        {mode === 'day' && <>
          <div className="card" style={{ padding: 14, gap: 12 }}>
          <div className="between">
            <button className="icon-btn soft" aria-label="Previous week" onClick={() => setDay(addDays(day, -7))}><IconChevronLeft size={20} /></button>
            <b style={{ fontSize: 14.5, fontWeight: 600 }}>{fmtDate(mon, { day: 'numeric', month: 'short' })} – {fmtDate(addDays(mon, 6), { day: 'numeric', month: 'short', year: 'numeric' })}</b>
            <button className="icon-btn soft" aria-label="Next week" onClick={() => setDay(addDays(day, 7))}><IconChevronRight size={20} /></button>
          </div>
          <div className="week">
            {week.map(d => (
              <button key={d} className={`${d === day ? 'on' : ''} ${d === TODAY ? 'today' : ''}`} onClick={() => setDay(d)} aria-label={fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })}>
                {fmtDate(d, { weekday: 'short' }).slice(0, 3)}<b>{Number(d.slice(8))}</b>
                <span className="dots">{on(d).slice(0, 3).map(a => <i key={a.id} className={a.kind === 'Time off' ? 'o' : a.kind === 'Snag visit' ? 'w' : ''} />)}</span>
              </button>
            ))}
          </div>
          </div>
        </>}
      </div>
    </>}>
      <div className="pad" style={{ paddingTop: 4 }}>
        {mode === 'day' ? <>
          <div className="sec"><h3>{dayLabel(day)}</h3><span className="tiny muted">{on(day).filter(a => a.kind !== 'Time off').length} visits</span></div>
          {on(day).length === 0 && <Empty icon={<IconCalendarEvent size={24} />} title={new Date(day + 'T12:00:00').getDay() === 0 ? 'Sunday · not a working day' : 'Nothing booked'} sub="The office books your visits." />}
          {on(day).map(a => <div key={a.id} className="agenda"><span className="tm">{startOf(a.time)}<small>{a.time.split('– ')[1] || ''}</small></span><Item a={a} /></div>)}
        </> : <>
          {upcoming.length === 0 && <Empty icon={<IconCalendarEvent size={24} />} title="Nothing booked" sub="The office books your visits." />}
          {upcoming.map(d => (
            <div key={d} className="vstack" style={{ gap: 8 }}>
              <div className="sec"><h3>{dayLabel(d)}</h3></div>
              {on(d).map(a => <div key={a.id} className="agenda"><span className="tm" style={{ paddingTop: 12 }}>{startOf(a.time)}</span><Item a={a} /></div>)}
            </div>
          ))}
        </>}
        <div className="card tight">
          <div className="hstack" style={{ gap: 12 }}><span className="icircle jade"><IconBrandWindows size={20} /></span><span className="vstack grow" style={{ gap: 1 }}><span className="row-title">Synced with Outlook</span><span className="row-sub">{synced} · busy times block bookings</span></span><button className="icon-btn soft" aria-label="Sync now" onClick={() => { setSynced('just now'); toast('Synced with Outlook'); }}><IconRefresh size={18} /></button></div>
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
