// The pop-ups (bottom sheets) for every surveyor action: On my way, Can't make it, Customer not in,
// time off, paperwork report, log a call, and the visit's "more" menu.
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconSend, IconClock, IconInfoCircle, IconCalendarOff, IconDoorOff, IconAlertTriangle, IconBeach, IconCircleCheck, IconUpload,
  IconFileTypePdf, IconReplace, IconPhone, IconMapPin, IconMessage, IconCar, IconPhoneCall, IconHistory, IconEye, IconTrash,
} from '@tabler/icons-react';
import { Sheet, Field, Check, useToast, Tag } from './kit';
import { me } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate } from '../data/store';
import type { PaperReport, FPItem } from '../data/framepoint';
import { Visit, useVisitActions, arrivalText, suggestedArrival, startOf, maps, sampleSheet, nowTime } from '../lib/visits';

export function OnMyWaySheet({ v, onClose }: { v: Visit; onClose: () => void }) {
  const toast = useToast();
  const { onWay } = useVisitActions();
  const [at, setAt] = useState(suggestedArrival);
  const valid = /^\d{2}:\d{2}$/.test(at);
  return (
    <Sheet title="Tell the customer you are on your way" sub={`${v.customer} · ${v.e?.phone || ''}`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!valid} onClick={() => { onWay(v, at); toast(`Text sent · arriving about ${at}`); onClose(); }}><IconSend size={18} />Send text</button></>}>
      <Field label="What time will you get there?" hint={`Type the time, for example 13:30. The visit is booked for ${v.time}.`}>
        <div className="input-icon"><IconClock size={20} /><input type="time" className="input" value={at} onChange={x => setAt(x.target.value)} aria-label="Arrival time" style={{ fontSize: 20, fontWeight: 600 }} /></div>
      </Field>
      <div className="card flat tight" style={{ background: 'var(--bg)' }}><span className="tiny muted b">TEXT TO {v.e?.phone || v.customer}</span><span className="small t2">{arrivalText(v, valid ? at : '')}</span></div>
      <div className="alert info"><IconInfoCircle size={17} />The office sees it too, so they can answer if the customer calls.</div>
    </Sheet>
  );
}

export function CantMakeItSheet({ v, onClose }: { v: Visit; onClose: () => void }) {
  const toast = useToast();
  const { cantMake } = useVisitActions();
  const [why, setWhy] = useState('Running late from the last visit');
  const [when, setWhen] = useState(addDays(v.date < TODAY ? TODAY : v.date, 1));
  const [note, setNote] = useState('');
  const save = () => { cantMake(v, `${why}. Could move to ${fmtDate(when, { weekday: 'long', day: 'numeric', month: 'long' })}.${note ? ' ' + note : ''}`); toast('Sent to Sarah in the office'); onClose(); };
  return (
    <Sheet title="Can't make this visit?" sub={`${v.customer} · ${fmtDate(v.date)} · ${v.time}`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}><IconCalendarOff size={18} />Ask to move it</button></>}>
      <Field label="What is the reason?"><div className="chips wrap">{['Running late from the last visit', 'Car trouble', 'Unwell', 'Another visit took longer', 'Other'].map(r => <button key={r} type="button" className={`chip ${why === r ? 'on' : ''}`} onClick={() => setWhy(r)}>{r}</button>)}</div></Field>
      <Field label="When could you go instead?"><input type="date" className="input" min={TODAY} value={when} onChange={x => x.target.value && setWhen(x.target.value)} /></Field>
      <Field label="Anything else? (optional)"><input className="input" value={note} onChange={x => setNote(x.target.value)} placeholder="e.g. Free after 2pm" /></Field>
      <div className="alert info"><IconInfoCircle size={17} />The office books the new time and tells the customer. The visit stays in your list until they do.</div>
    </Sheet>
  );
}

export function NoAccessSheet({ v, onClose }: { v: Visit; onClose: () => void }) {
  const toast = useToast();
  const nav = useNavigate();
  const { noAccess } = useVisitActions();
  const [rang, setRang] = useState(true);
  const [called, setCalled] = useState(true);
  const [card, setCard] = useState(true);
  const [note, setNote] = useState('');
  const save = () => {
    const reason = [rang && 'No answer at the door', called && 'no answer on the phone', card && 'left a card'].filter(Boolean).join(', ') + (note ? `. ${note}` : '.');
    noAccess(v, reason); toast('Sent back to the office to rebook'); onClose(); nav('/');
  };
  return (
    <Sheet title="The customer is not in" sub={`${v.customer} · ${v.address}`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-danger" disabled={!rang && !called && note.trim().length < 3} onClick={save}><IconDoorOff size={18} />Send back</button></>}>
      <div className="vstack" style={{ gap: 4 }}>
        <Check on={rang} onChange={setRang} label="I knocked and rang the bell" />
        <Check on={called} onChange={setCalled} label={`I called ${v.e?.phone || 'the customer'}`} />
        <Check on={card} onChange={setCard} label="I left a calling card" />
      </div>
      <Field label="Anything else? (optional)"><input className="input" value={note} onChange={x => setNote(x.target.value)} placeholder="e.g. Neighbour says they are away" /></Field>
      <div className="alert warn"><IconAlertTriangle size={17} />The visit leaves your list. The office books a new date with the customer and it comes back to you.</div>
    </Sheet>
  );
}

export function TimeOffSheet({ onClose, day }: { onClose: () => void; day?: string }) {
  const toast = useToast();
  const { set, appts } = useStore();
  const [date, setDate] = useState(day && day >= TODAY ? day : addDays(TODAY, 3));
  const [part, setPart] = useState('All day');
  const [why, setWhy] = useState('Holiday');
  const time = part === 'All day' ? '08:00 – 17:00' : part === 'Morning' ? '08:00 – 12:30' : '12:30 – 17:00';
  const sunday = new Date(date + 'T12:00:00').getDay() === 0;
  const clash = appts.find(a => a.who === me.id && a.date === date && ['Booked', 'On site'].includes(a.status) && a.kind !== 'Time off' && (part === 'All day' || (part === 'Morning' ? a.time < '12:30' : a.time >= '12:30')));
  const save = () => { set('appts', as => [...as, { id: 'to' + Date.now(), kind: 'Time off', customer: why, who: me.id, date, time, synced: true, status: 'Booked', note: part }]); toast(`Time off added · ${fmtDate(date)}`); onClose(); };
  return (
    <Sheet title="Add time off" sub="The office will not book visits for you then." onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!!clash} onClick={save}><IconBeach size={18} />Add time off</button></>}>
      <Field label="Day"><input type="date" className="input" min={TODAY} value={date} onChange={x => x.target.value && setDate(x.target.value)} /></Field>
      <Field label="How long?"><div className="seg">{['All day', 'Morning', 'Afternoon'].map(p => <button key={p} type="button" className={part === p ? 'on' : ''} onClick={() => setPart(p)}>{p}</button>)}</div></Field>
      <Field label="Reason"><div className="chips wrap">{['Holiday', 'Appointment', 'Training', 'Other'].map(r => <button key={r} type="button" className={`chip ${why === r ? 'on' : ''}`} onClick={() => setWhy(r)}>{r}</button>)}</div></Field>
      {clash ? <div className="alert err"><IconAlertTriangle size={17} />You have a visit with {clash.customer} then ({clash.time}). Use "Can't make it" on that visit first.</div>
        : sunday ? <div className="alert info"><IconInfoCircle size={17} />Sundays are not working days. You can still add it.</div>
        : <div className="alert ok"><IconCircleCheck size={17} />Nothing is booked for you then.</div>}
    </Sheet>
  );
}

/** Upload the paper survey sheet instead of typing every size. Typed sizes are then not used. */
const kbOf = (n: number) => Math.max(1, Math.round(n / 1024));
export function PaperSheet({ items, customer, typed, current, onClose, onSave }: { items: FPItem[]; customer: string; typed: number; current?: PaperReport; onClose: () => void; onSave: (p: PaperReport) => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<Omit<PaperReport, 'changed' | 'at'> | null>(current ? { file: current.file, kb: current.kb, type: current.type, preview: current.preview } : null);
  const [diff, setDiff] = useState<'same' | 'some' | ''>(current ? (current.changed.length ? 'some' : 'same') : '');
  const [changed, setChanged] = useState<number[]>(current?.changed || []);
  const pick = (f?: File) => {
    if (!f) return;
    const type = f.type === 'application/pdf' || /\.pdf$/i.test(f.name) ? 'pdf' : f.type.startsWith('image/') ? 'image' : null;
    if (!type) { toast('Please choose a PDF or a photo'); return; }
    if (f.size > 15 * 1024 * 1024) { toast('That file is too big · under 15 MB please'); return; }
    const base = { file: f.name, kb: kbOf(f.size), type: type as 'pdf' | 'image' };
    if (f.size <= 1.5 * 1024 * 1024) { const r = new FileReader(); r.onload = () => setFile({ ...base, preview: String(r.result) }); r.readAsDataURL(f); } else setFile(base);
  };
  const ok = !!file && (diff === 'same' || (diff === 'some' && changed.length > 0));
  return (
    <Sheet title={current ? 'Replace the paperwork report' : 'Upload the paperwork report'} sub={`${customer} · ${items.length} item${items.length === 1 ? '' : 's'}`} onClose={onClose} full
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!ok} onClick={() => onSave({ ...file!, at: nowTime(), changed: diff === 'some' ? changed : [] })}><IconUpload size={18} />Use this report</button></>}>
      <span className="small t2">Wrote the sizes on the paper survey sheet? Take a clear photo of it, or upload the PDF. You don't need to type the sizes.</span>
      <input ref={input} type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={x => { pick(x.target.files?.[0]); x.target.value = ''; }} aria-label="Paperwork report file" />
      {file ? (
        <div className="file">
          {file.type === 'image' && file.preview ? <img src={file.preview} alt="" style={{ width: 56, height: 56, objectFit: 'cover', objectPosition: 'top', borderRadius: 10, border: '1px solid var(--border)' }} /> : <span className="tile" style={{ width: 56, height: 56, borderRadius: 10, background: '#fdecec' }}><IconFileTypePdf size={26} color="#d64545" /></span>}
          <div className="grow vstack" style={{ gap: 2 }}><b className="ell" style={{ fontSize: 14 }}>{file.file}</b><span className="tiny muted">{file.type === 'pdf' ? 'PDF' : 'Photo'} · {file.kb} KB</span></div>
          <button className="btn btn-outline btn-xs" onClick={() => input.current?.click()}><IconReplace size={14} />Change</button>
        </div>
      ) : (
        <div className="vstack" style={{ gap: 10, alignItems: 'stretch', padding: 18, border: '2px dashed #c6d3cf', borderRadius: 16, background: 'var(--tint-2)', textAlign: 'center' }}>
          <span className="tile" style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', margin: '0 auto', color: 'var(--primary-dark)' }}><IconUpload size={24} /></span>
          <b style={{ fontSize: 15 }}>Add the paper survey sheet</b>
          <span className="tiny muted">PDF or photo · up to 15 MB</span>
          <button className="btn btn-primary btn-sm" onClick={() => input.current?.click()}><IconUpload size={16} />Take photo or choose file</button>
          <button className="btn btn-outline btn-sm" onClick={() => setFile({ file: `Survey sheet ${customer}.jpg`, kb: 864, type: 'image', preview: sampleSheet(items, customer) })}>Use a sample report</button>
        </div>
      )}
      <Field label="Are the sizes the same as the salesperson's?">
        <div className="yn" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button type="button" className={diff === 'same' ? 'yes' : ''} onClick={() => setDiff('same')}>Yes, all the same</button>
          <button type="button" className={diff === 'some' ? 'no' : ''} onClick={() => setDiff('some')}>Some are different</button>
        </div>
      </Field>
      {diff === 'some' && <Field label="Which items are different?"><div className="vstack" style={{ gap: 2 }}>{items.map(i => <Check key={i.no} on={changed.includes(i.no)} onChange={val => setChanged(c => (val ? [...c, i.no] : c.filter(n => n !== i.no)))} label={<span>{i.no}. {i.name}{i.qty > 1 ? ` × ${i.qty}` : ''}<br /><span className="tiny muted">Sales measured {i.size}</span></span>} />)}</div></Field>}
      {typed > 0 && <div className="alert warn"><IconAlertTriangle size={17} />You have typed {typed === 1 ? '1 size' : `${typed} sizes`}. {typed === 1 ? 'It' : 'They'} will be removed and the paperwork report used instead.</div>}
      <div className="alert info"><IconInfoCircle size={17} />The report is added to the final survey, so the office and the salesperson see exactly what you wrote.</div>
    </Sheet>
  );
}

/** A paperwork report that has been added: preview, view, replace, remove. */
export function PaperCard({ p, onReplace, onRemove }: { p: PaperReport; onReplace?: () => void; onRemove?: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const view = () => (p.preview ? setOpen(true) : toast(`Opening ${p.file}`));
  return (
    <div className="card tight flat">
      <button type="button" className="hstack" style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', gap: 12 }} onClick={view}>
        {p.type === 'image' && p.preview ? <img src={p.preview} alt="Paperwork report" style={{ width: 64, height: 64, objectFit: 'cover', objectPosition: 'top', borderRadius: 10, border: '1px solid var(--border)' }} /> : <span className="tile" style={{ width: 64, height: 64, borderRadius: 10, background: '#fdecec' }}><IconFileTypePdf size={28} color="#d64545" /></span>}
        <span className="grow vstack" style={{ gap: 3 }}>
          <b className="ell" style={{ fontSize: 14 }}>{p.file}</b>
          <span className="tiny muted">{p.type === 'pdf' ? 'PDF' : 'Photo'} · {p.kb} KB · added {p.at}</span>
          {p.changed.length ? <Tag tone="warn">{p.changed.length} different from sales</Tag> : <Tag tone="ok">All the same as sales</Tag>}
        </span>
      </button>
      <div className="hstack" style={{ gap: 8 }}>
        <button className="btn btn-outline btn-xs grow" onClick={view}><IconEye size={14} />View</button>
        {onReplace && <button className="btn btn-outline btn-xs grow" onClick={onReplace}><IconReplace size={14} />Replace</button>}
        {onRemove && <button className="btn btn-grey btn-xs grow" onClick={onRemove}><IconTrash size={14} />Remove</button>}
      </div>
      {open && p.preview && (
        <Sheet title={p.file} sub="Paperwork report" onClose={() => setOpen(false)} full footer={<button className="btn btn-primary" onClick={() => setOpen(false)}>Close</button>}>
          {p.type === 'pdf' ? <iframe src={p.preview} title={p.file} style={{ width: '100%', height: 520, border: '1px solid var(--border)', borderRadius: 10 }} /> : <img src={p.preview} alt={p.file} style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }} />}
        </Sheet>
      )}
    </div>
  );
}

export function CallSheet({ v, onClose }: { v: Visit; onClose: () => void }) {
  const toast = useToast();
  const { updEnq } = useStore();
  const [dir, setDir] = useState('I called the customer');
  const [out, setOut] = useState('Spoke to customer');
  const [txt, setTxt] = useState('');
  return (
    <Sheet title="Log a phone call" sub={`${v.customer} · ${v.e?.phone || ''}`} onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!txt.trim()} onClick={() => { if (v.e) updEnq(v.e.id, {}, { kind: 'call', title: `${dir} · ${out}`, body: txt, who: me.name }); toast('Call saved on the record'); onClose(); }}>Save call</button></>}>
      <Field label="Who called"><div className="seg">{['I called the customer', 'Customer called me'].map(o => <button key={o} type="button" className={dir === o ? 'on' : ''} onClick={() => setDir(o)}>{o === 'I called the customer' ? 'I called' : 'They called'}</button>)}</div></Field>
      <Field label="What happened"><div className="chips wrap">{['Spoke to customer', 'Left a voicemail', 'No answer'].map(o => <button key={o} type="button" className={`chip ${out === o ? 'on' : ''}`} onClick={() => setOut(o)}>{o}</button>)}</div></Field>
      <Field label="What was said"><textarea className="textarea" value={txt} onChange={x => setTxt(x.target.value)} placeholder="Short summary of the call" /></Field>
    </Sheet>
  );
}

/** The "more" menu on a visit. */
export function VisitMenu({ v, onClose, onPick, open }: { v: Visit; onClose: () => void; onPick: (k: string) => void; open: boolean }) {
  const toast = useToast();
  const item = (k: string, I: any, l: string, s: string, tone?: string) => (
    <button key={k} className="menu-item" onClick={() => { onClose(); onPick(k); }}>
      <span className="ic" style={tone === 'warn' ? { background: '#fdf3d9', color: '#8a6400' } : tone === 'err' ? { background: '#fdeeee', color: '#d64545' } : undefined}><I size={20} /></span>
      <span className="grow">{l}<small>{s}</small></span>
    </button>
  );
  return (
    <Sheet title={v.customer} sub={`${v.kind} · ${v.time}`} onClose={onClose}>
      <div className="vstack" style={{ gap: 0 }}>
        <a className="menu-item" href={`tel:${(v.e?.phone || '').replace(/\s/g, '')}`} onClick={() => { toast(`Calling ${v.customer}`); onClose(); }}><span className="ic"><IconPhone size={20} /></span><span className="grow">Call the customer<small>{v.e?.phone}</small></span></a>
        <a className="menu-item" href={maps(v.address)} target="_blank" rel="noreferrer" onClick={onClose}><span className="ic"><IconMapPin size={20} /></span><span className="grow">Directions<small>{v.address}</small></span></a>
        {open && v.status === 'Booked' && item('way', IconCar, 'On my way', 'Text the customer your arrival time')}
        {item('call', IconPhoneCall, 'Log a phone call', 'Saved on the customer record')}
        {item('msg', IconMessage, 'Message the office', 'Only staff see this')}
        {item('history', IconHistory, 'History', 'Everything on this record')}
        {open && v.status !== 'On site' && item('cant', IconCalendarOff, "Can't make it", 'Ask the office to move this visit', 'warn')}
        {open && v.status !== 'On site' && v.date <= TODAY && item('noaccess', IconDoorOff, 'Customer not in', 'Send it back to the office to rebook', 'err')}
      </div>
    </Sheet>
  );
}

/** Message the office about a visit (staff only). */
export function OfficeMsgSheet({ v, onClose }: { v: Visit; onClose: () => void }) {
  const toast = useToast();
  const { updEnq } = useStore();
  const [txt, setTxt] = useState('');
  return (
    <Sheet title="Message the office" sub="Only staff see this · Sarah Mitchell" onClose={onClose}
      footer={<><button className="btn btn-grey" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!txt.trim()} onClick={() => { if (v.e) updEnq(v.e.id, {}, { kind: 'note', title: `Message from ${me.first} (surveyor)`, body: txt, who: me.name }); toast('Sent to the office'); onClose(); }}><IconSend size={18} />Send</button></>}>
      <textarea className="textarea" style={{ height: 130, background: '#fffbef' }} value={txt} onChange={x => setTxt(x.target.value)} placeholder="e.g. Customer asked if the door can be fitted first" autoFocus />
      <div className="chips wrap">{['Running about 15 minutes late', 'Customer has asked a question about the price', 'Access is harder than expected'].map(s => <button key={s} type="button" className="chip" onClick={() => setTxt(s)}>{s}</button>)}</div>
    </Sheet>
  );
}

export const timeOf = (v: Visit) => startOf(v.time);
