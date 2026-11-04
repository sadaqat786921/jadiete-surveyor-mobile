// An aftercare or snag inspection: look at the problem first, so the fitter goes back with the right part.
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconChevronLeft, IconDots, IconMapPin, IconCar, IconPlayerPlay, IconSend, IconClock, IconCalendarOff, IconTool, IconInfoCircle, IconShieldCheck, IconPhone, IconHistory, IconArrowRight, IconCircleCheck, IconAlertTriangle, IconMessageCircle } from '@tabler/icons-react';
import { Screen, Header, Tag, Avatar, Steps, Field, PhotoGrid, SignaturePad, Empty, useToast } from '../ui/kit';
import { me } from '../data/mock';
import { useStore, TODAY, fmtDate } from '../data/store';
import { useMyVisits, statusTone, short, img, maps, useVisitActions, CAUSES } from '../lib/visits';
import { VisitSheets } from './Survey';

export default function Inspection() {
  const { id } = useParams();
  const v = useMyVisits().find(x => x.kind === 'Inspection' && x.id === id && x.status !== 'No access');
  if (!v) return <Screen header={<Header back="/visits" title="Inspection" />}><Empty icon={<IconTool size={24} />} title="This inspection is not booked for you" sub="It may have been sent back to the office or moved to someone else." action={<Link to="/visits" className="btn btn-primary btn-sm">Back to my visits</Link>} /></Screen>;
  return <View key={v.id} v={v} />;
}

function View({ v }: { v: ReturnType<typeof useMyVisits>[number] }) {
  const nav = useNavigate();
  const toast = useToast();
  const { set, updEnq, appts } = useStore();
  const { start } = useVisitActions();
  const x = v.snag; const e = v.e;
  const a = appts.find(ap => ap.snag === x.id);
  const done = !!x.inspected;
  const onSite = !!x.inspStarted && !done;
  const canStart = v.date <= TODAY;
  const [sheet, setSheet] = useState<string | null>(null);
  const [cause, setCause] = useState('');
  const [found, setFound] = useState('');
  const [fix, setFix] = useState('');
  const [part, setPart] = useState('');
  const [urgent, setUrgent] = useState('Within 2 weeks');
  const [photos, setPhotos] = useState(0);
  const [signed, setSigned] = useState(false);
  const advice = cause.startsWith('Not a fault');
  const ready = !!cause && found.trim().length > 4 && photos > 0 && (advice || fix.trim().length > 3);
  const step = ['Booked', 'On my way', 'On site', 'Submitted'].indexOf(v.status);
  const submit = () => {
    const text = `${cause}. ${found}${advice ? '' : ` Fix: ${fix}.${part ? ` Part: ${part}.` : ''} ${urgent}.`} ${photos} photo${photos === 1 ? '' : 's'}.${signed ? ' Customer signed.' : ''}`;
    set('snags', ss => ss.map(s => (s.id === x.id ? { ...s, status: advice ? 'Fixed' : 'Inspected', tone: advice ? 'ok' : 'warn', owner: 'Aftercare team', inspectedBy: me.name, detail: `${s.detail} — Inspected by ${me.name} ${short(TODAY)}: ${text}`, inspected: { on: short(TODAY), iso: TODAY, cause, found, fix, part, urgent, photos, signed } } : s)));
    set('appts', as => as.map(ap => (ap.snag === x.id && ['Booked', 'On site'].includes(ap.status) ? { ...ap, status: 'Done' } : ap)));
    if (e) updEnq(e.id, {}, { kind: 'note', title: `Inspection done · ${x.title}`, body: advice ? `${text} No visit needed.` : `${text} Please book the return visit.`, who: me.name });
    nav(`/done/inspection/${v.id}`, { replace: true });
  };
  const foot = done ? undefined
    : onSite ? <><button className="btn btn-primary btn-block" disabled={!ready} onClick={submit}><IconSend size={18} />Submit findings</button>{!ready && <span className="tiny muted" style={{ textAlign: 'center' }}>Choose a cause, say what you found{advice ? '' : ' and how to fix it'}, and add a photo.</span>}</>
    : !canStart ? <><button className="btn btn-primary btn-block" disabled><IconClock size={18} />Starts {fmtDate(v.date)}</button><button className="btn btn-ghost btn-sm" onClick={() => setSheet('cant')}><IconCalendarOff size={16} />Can't make it</button></>
    : <div className="row2">{v.status === 'Booked' && <button className="btn btn-outline" onClick={() => setSheet('way')}><IconCar size={18} />On my way</button>}<button className="btn btn-primary" onClick={() => { start(v); toast('Inspection started'); }}><IconPlayerPlay size={18} />Start inspection</button></div>;

  return (
    <Screen foot={foot} header={<Header back over={`${x.kind === 'Aftercare' ? 'Aftercare' : 'Snag'} inspection · ${x.id}`} title={x.customer} right={<button className="icon-btn" aria-label="More" onClick={() => setSheet('menu')}><IconDots size={20} /></button>} />}>
      <div className="pad">
        <div className="cover" style={{ backgroundImage: `url(${img(x.photo)})`, height: 170 }}>
          <div className="photo-tags"><Tag tone="warn">Inspection</Tag><Tag tone={statusTone[v.status]}>{v.status}</Tag></div>
        </div>
        <div className="card">
          <div className="between" style={{ alignItems: 'flex-start' }}>
            <span className="vstack" style={{ gap: 3 }}><span className="label">{fmtDate(v.date, { weekday: 'long', day: 'numeric', month: 'long' })}</span><b style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.6 }}>{v.time || '—'}</b></span>
            <span className="outline-pill">{x.job}</span>
          </div>
          <div className="facts"><span><IconTool size={17} />{x.title}</span><span><IconMapPin size={17} />{v.address}</span></div>
          <div className="divider" />
          <Steps at={step} done={done} times={[undefined, x.inspOnWay, x.inspStarted]} />
        </div>
        {x.moveAsked && !done && <div className="alert warn"><IconCalendarOff size={17} /><span><b>You asked the office to move this visit.</b> {x.moveAsked}</span></div>}
        <div className="alert warn"><IconMessageCircle size={16} /><span><b>What the customer said</b><br />{x.detail.split(' — Inspected')[0]}<br /><span className="tiny muted">Reported by {x.reported}</span></span></div>
        <div className="card" style={{ padding: '6px 20px' }}><div className="kvs">
          <div><span>Products</span><b>{e?.product || '—'}</b></div>
          <div><span>Fitted</span><b>{e?.ops?.completion?.on || 'Jun 2026'}</b></div>
          <div><span>Guarantee</span><b>{e?.ops?.closed ? '10 years from fitting' : 'In guarantee'}</b></div>
        </div></div>

        {done ? <>
          <div className={`alert ${x.status === 'Fixed' ? 'ok' : 'info'}`}><IconCircleCheck size={17} /><span><b>Submitted {x.inspected.on}.</b> {x.status === 'Fixed' ? 'Closed with advice — no visit needed.' : 'The office books the fitter with the right part.'}</span></div>
          <div className="sec"><h3>What you found</h3></div>
          <div className="card" style={{ padding: '6px 20px' }}><div className="kvs">
            {([['Cause', x.inspected.cause], ['What you found', x.inspected.found], ['Fix', x.inspected.fix || 'None needed'], ['Part', x.inspected.part || '—'], ['How soon', x.status === 'Fixed' ? '—' : x.inspected.urgent], ['Photos', String(x.inspected.photos)], ['Customer signed', x.inspected.signed ? 'Yes' : 'No']] as [string, string][]).map(([l, val]) => <div key={l}><span>{l}</span><b>{val}</b></div>)}
          </div></div>
        </> : onSite ? <>
          <div className="alert warn"><IconArrowRight size={17} /><span><b>On site since {x.inspStarted}.</b> Say what you found, how to fix it and take photos.</span></div>
          <div className="sec"><h3>Your findings</h3><span className="tiny muted">The office and the fitter read this</span></div>
          <Field label="What is causing it?"><div className="chips wrap">{CAUSES.map(c => <button key={c} type="button" className={`chip ${cause === c ? 'on' : ''}`} onClick={() => setCause(c)}>{c}</button>)}</div></Field>
          <Field label="What did you find?"><textarea className="textarea" value={found} onChange={y => setFound(y.target.value)} placeholder="e.g. Top hinge is loose so the sash drops and the seal does not close" /></Field>
          {advice ? <div className="alert ok"><IconShieldCheck size={17} />No visit is needed. The office sends the customer your advice and closes it.</div> : <>
            <Field label="How should it be fixed?"><input className="input" value={fix} onChange={y => setFix(y.target.value)} placeholder="e.g. Re-pack and adjust the hinges" /></Field>
            <Field label="Part needed (optional)"><input className="input" value={part} onChange={y => setPart(y.target.value)} placeholder="e.g. Friction hinge 16in" /></Field>
            <Field label="How soon?"><div className="vstack" style={{ gap: 6 }}>{['As soon as possible', 'Within 2 weeks', 'Next time we are nearby'].map(o => <button key={o} type="button" className={`chip ${urgent === o ? 'on' : ''}`} style={{ justifyContent: 'flex-start', height: 48 }} onClick={() => setUrgent(o)}>{o}</button>)}</div></Field>
          </>}
          <Field label={`Photos · ${photos}`}><PhotoGrid n={photos} seed={1} onAdd={() => { setPhotos(p => p + 1); toast('Photo added'); }} onRemove={() => setPhotos(p => Math.max(0, p - 1))} /></Field>
          <div className="card"><span className="row-title">Customer signature (optional)</span><SignaturePad value={signed} onChange={setSigned} name={x.customer} /></div>
        </> : <>
          <div className="alert info"><IconInfoCircle size={17} /><span>{canStart ? <><b>Next: {x.inspOnWay ? 'start the inspection when you arrive' : 'tell the customer you are on your way'}.</b></> : <>Booked for {fmtDate(v.date, { weekday: 'long', day: 'numeric', month: 'long' })}. Start it on the day.</>}</span></div>
          {a && <span className="small muted">Booked by the office for {fmtDate(a.date)} · {a.time}</span>}
        </>}

        {e && <>
          <div className="sec"><h3>Customer</h3></div>
          <div className="card">
            <div className="hstack" style={{ gap: 12 }}><Avatar i={e.initials} size={46} /><div className="vstack grow" style={{ gap: 1 }}><span className="row-title">{x.customer}</span><span className="row-sub">{e.phone}</span></div>
              <a className="icon-btn soft" aria-label="Call" href={`tel:${e.phone.replace(/\s/g, '')}`} onClick={() => toast(`Calling ${x.customer}`)}><IconPhone size={19} /></a>
              <a className="icon-btn soft" aria-label="Directions" href={maps(v.address)} target="_blank" rel="noreferrer"><IconMapPin size={19} /></a></div>
          </div>
          <div className="grid-2"><button className="btn btn-outline btn-sm" onClick={() => setSheet('msg')}><IconSend size={16} />Message office</button><Link className="btn btn-outline btn-sm" to={`/history/${e.id}`}><IconHistory size={16} />History</Link></div>
        </>}
        {!e && <div className="alert warn"><IconAlertTriangle size={17} />No customer record linked.</div>}
      </div>
      <VisitSheets v={v} sheet={sheet} setSheet={setSheet} />
    </Screen>
  );
}
