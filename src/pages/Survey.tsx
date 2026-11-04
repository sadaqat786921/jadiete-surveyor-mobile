// The final survey on the surveyor's phone:
// visit details → On my way → Start survey → 1 Measure → 2 Site checks → 3 Photos → 4 Sign → 5 Check and submit → Done → Report.
import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  IconChevronLeft, IconDots, IconMapPin, IconPhone, IconCar, IconPlayerPlay, IconArrowRight, IconClock, IconRuler, IconAlertTriangle,
  IconInfoCircle, IconCircleCheck, IconFileTypePdf, IconCopy, IconUpload, IconCamera, IconNote, IconCalendarOff, IconSend, IconDownload,
  IconChevronRight, IconSignature, IconPhoto, IconListCheck, IconCheck, IconDeviceFloppy, IconHistory, IconHome, IconMail, IconPhoneCall, IconSettings, IconBellRinging, IconNotes, IconMailForward, IconDoorOff, IconFileText,
} from '@tabler/icons-react';
import { Screen, Header, Tag, Avatar, Thumb, Steps, Field, SignaturePad, PhotoGrid, Empty, useToast, Sheet } from '../ui/kit';
import { OnMyWaySheet, CantMakeItSheet, NoAccessSheet, VisitMenu, CallSheet, OfficeMsgSheet, PaperSheet, PaperCard } from '../ui/sheets';
import { me, staffById } from '../data/mock';
import { useStore, TODAY, fmtDate, EnquiryX } from '../data/store';
import type { FinalCheck, SiteCheck, PaperReport } from '../data/framepoint';
import {
  useMyVisits, Visit, isOpenVisit, statusTone, itemsToCheck, frameCount, salespersonOf, maps, plural, startOf, short, img, nowTime, useVisitActions,
  SITE_CHECKS, TOL, parseSize, M, sizeOf, sizeDiff, sizeMatches,
} from '../lib/visits';

const useSurveyVisit = (id?: string) => useMyVisits().find(x => x.kind === 'Final survey' && x.id === id && x.status !== 'No access');

function NotMine() {
  return <Screen header={<Header back="/visits" title="Final survey" />}><Empty icon={<IconDoorOff size={24} />} title="This survey is not booked for you" sub="It may have been sent back to the office or moved to another surveyor." action={<Link to="/visits" className="btn btn-primary btn-sm">Back to my visits</Link>} /></Screen>;
}

/* ================= Visit details ================= */
export function SurveyVisit() {
  const { id } = useParams();
  const v = useSurveyVisit(id);
  if (!v || !v.e) return <NotMine />;
  if (v.status === 'Submitted') return <Navigate to={`/report/${v.id}`} replace />;
  return <VisitView key={v.id} v={v} e={v.e} />;
}

function VisitView({ v, e }: { v: Visit; e: EnquiryX }) {
  const nav = useNavigate();
  const toast = useToast();
  const { start } = useVisitActions();
  const [sheet, setSheet] = useState<string | null>(null);
  const fs = e.finalSurvey!;
  const items = itemsToCheck(e);
  const canStart = fs.date <= TODAY;
  const onSite = fs.status === 'Started';
  const step = ['Booked', 'On my way', 'On site', 'Submitted'].indexOf(v.status);
  const go = () => { if (!onSite) { start(v); toast('Survey started · everything saves as you go'); } nav(`/survey/${v.id}/measure`); };
  return (
    <Screen header={<Header back over={`Final survey · ${e.jobId || e.id}`} title={e.name} right={<button className="icon-btn" aria-label="More" onClick={() => setSheet('menu')}><IconDots size={20} /></button>} />} foot={
      onSite ? <button className="btn btn-primary btn-block" onClick={go}>Continue the survey<IconArrowRight size={18} /></button>
        : !canStart ? <><button className="btn btn-primary btn-block" disabled><IconClock size={18} />Starts {fmtDate(fs.date, { weekday: 'long', day: 'numeric', month: 'short' })}</button><button className="btn btn-ghost btn-sm" onClick={() => setSheet('cant')}><IconCalendarOff size={16} />Can't make it</button></>
        : <div className="row2">{v.status === 'Booked' && <button className="btn btn-outline" onClick={() => setSheet('way')}><IconCar size={18} />On my way</button>}<button className="btn btn-primary" onClick={go}><IconPlayerPlay size={18} />Start survey</button></div>
    }>
      <div className="pad">
        <div className="cover" style={{ backgroundImage: `url(${img(e.photo)})` }}>
          <div className="photo-tags"><Tag tone="jade">Final survey</Tag><Tag tone={statusTone[v.status]}>{v.status}</Tag></div>
        </div>
        <div className="card">
          <div className="between" style={{ alignItems: 'flex-start' }}>
            <span className="vstack" style={{ gap: 3 }}><span className="label">{fmtDate(fs.date, { weekday: 'long', day: 'numeric', month: 'long' })}</span><b style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.6 }}>{fs.time}</b></span>
            <span className="outline-pill">{plural(frameCount(e), 'frame')}</span>
          </div>
          <div className="facts"><span><IconMapPin size={17} />{e.address}, {e.postcode}</span></div>
          <div className="divider" />
          <Steps at={step} times={[undefined, fs.onWay, fs.startedAt]} />
        </div>
        {fs.moveAsked && <div className="alert warn"><IconCalendarOff size={16} /><span><b>You asked the office to move this visit.</b> {fs.moveAsked} Sarah will confirm the new time.</span></div>}
        <div className="alert info"><IconArrowRight size={16} /><span>{onSite ? <><b>On site since {fs.startedAt}.</b> Carry on where you left off.</> : canStart ? <><b>Next: {fs.onWay ? 'start the survey when you arrive' : 'tell the customer you are on your way'}.</b> Read the salesperson's notes and sizes first.</> : <><b>Booked for {fmtDate(fs.date, { weekday: 'long', day: 'numeric', month: 'long' })}.</b> You can read everything now.</>}</span></div>
        {e.survey?.notes && <div className="alert warn"><IconAlertTriangle size={16} /><span><b>{salespersonOf(e).split(' ')[0]} asked you to check</b><br />{e.survey.notes}</span></div>}

        <div className="sec"><h3>About the visit</h3></div>
        <div className="card" style={{ padding: '6px 20px' }}><div className="kvs">
          <div><span>Measured by</span><b>{salespersonOf(e)}</b></div>
          <div><span>Framepoint quote</span><b>{e.survey?.fp?.ref || '—'}</b></div>
          <div><span>Items</span><b>{frameCount(e)} frames in {plural(items.length, 'item')}</b></div>
          <div><span>Access</span><b>{e.survey?.access || 'Front of the house'}</b></div>
          <div><span>Parking</span><b>{e.survey?.parking || 'On the street'}</b></div>
          {e.appt?.outcome && <div><span>Sales visit</span><b>{e.appt.outcome}</b></div>}
        </div></div>

        <div className="sec"><h3>What you will check</h3><span className="tiny muted">{plural(items.length, 'item')}</span></div>
        <div className="card flush"><div className="list">
          {items.map(i => (
            <div key={i.no} className="li" style={{ alignItems: 'flex-start' }}>
              <Thumb src={i.photo || 'window'} size={48} />
              <span className="vstack grow" style={{ gap: 3 }}>
                <span className="row-title">{i.no}. {i.name}{i.qty > 1 ? ` × ${i.qty}` : ''}</span>
                <span className="row-sub">{i.product}</span>
                <span className="small" style={{ fontWeight: 600, marginTop: 2 }}>{i.size}</span>
              </span>
            </div>
          ))}
        </div></div>

        {e.survey?.fp && <>
          <div className="sec"><h3>Documents</h3></div>
          {[[e.survey.fp.file, 'Survey report from Framepoint'], [e.survey.fp.quoteFile, 'Accepted quote']].map(([f, sub]) => (
            <button key={f} className="file" onClick={() => toast(`Opening ${f}`)}><span className="icircle" style={{ background: 'var(--err-bg)', color: 'var(--err)' }}><IconFileTypePdf size={20} /></span><span className="grow vstack" style={{ gap: 2 }}><span className="row-title ell" style={{ fontSize: 13.5 }}>{f}</span><span className="row-sub">{sub}</span></span><IconChevronRight size={18} color="#a3b0ad" /></button>
          ))}
        </>}

        <div className="sec"><h3>Customer</h3></div>
        <div className="card">
          <div className="hstack" style={{ gap: 12 }}><Avatar i={e.initials} size={46} /><div className="vstack grow" style={{ gap: 1 }}><span className="row-title">{e.name}</span><span className="row-sub">{e.phone}</span></div>
            <a className="icon-btn soft" aria-label="Call" href={`tel:${e.phone.replace(/\s/g, '')}`} onClick={() => toast(`Calling ${e.name}`)}><IconPhone size={19} /></a>
            <a className="icon-btn soft" aria-label="Directions" href={maps(`${e.address} ${e.postcode}`)} target="_blank" rel="noreferrer"><IconMapPin size={19} /></a></div>
        </div>
        <div className="sec"><h3>People on this job</h3></div>
        <People e={e} />
        <div className="grid-2">
          <button className="btn btn-outline btn-sm" onClick={() => setSheet('msg')}><IconSend size={16} />Message office</button>
          <Link className="btn btn-outline btn-sm" to={`/history/${e.id}`}><IconHistory size={16} />History</Link>
        </div>
      </div>
      <VisitSheets v={v} sheet={sheet} setSheet={setSheet} />
    </Screen>
  );
}

export function People({ e }: { e: EnquiryX }) {
  return (
    <div className="card flush"><div className="list">
      {([['Salesperson', salespersonOf(e), staffById(e.assigned)?.initials || 'S'], ['Surveyor', `${me.name} (you)`, me.initials], ['Office', 'Sarah Mitchell', 'SM']] as [string, string, string][]).map(([r, n, i]) => (
        <div key={r} className="li"><Avatar i={i} size={42} /><span className="vstack grow" style={{ gap: 1 }}><span className="row-title">{n}</span><span className="row-sub">{r}</span></span></div>
      ))}
    </div></div>
  );
}

export function VisitSheets({ v, sheet, setSheet }: { v: Visit; sheet: string | null; setSheet: (s: string | null) => void }) {
  const nav = useNavigate();
  const close = () => setSheet(null);
  return <>
    {sheet === 'menu' && <VisitMenu v={v} open={isOpenVisit(v)} onClose={close} onPick={k => (k === 'history' ? nav(`/history/${v.e?.id}`) : setSheet(k))} />}
    {sheet === 'way' && <OnMyWaySheet v={v} onClose={close} />}
    {sheet === 'cant' && <CantMakeItSheet v={v} onClose={close} />}
    {sheet === 'noaccess' && <NoAccessSheet v={v} onClose={close} />}
    {sheet === 'call' && <CallSheet v={v} onClose={close} />}
    {sheet === 'msg' && <OfficeMsgSheet v={v} onClose={close} />}
  </>;
}

/* ================= On site: the five steps ================= */
const STEPS = [['measure', 'Measure'], ['checks', 'Site checks'], ['photos', 'Photos'], ['sign', 'Sign'], ['review', 'Check and submit']] as const;

export function SurveyFlow() {
  const { id } = useParams();
  const v = useSurveyVisit(id);
  if (!v || !v.e) return <NotMine />;
  if (v.status === 'Submitted') return <Navigate to={`/report/${v.id}`} replace />;
  if (v.status !== 'On site') return <Navigate to={`/visit/${v.id}`} replace />;
  return <Flow key={v.id} v={v} e={v.e} />;
}

function Flow({ v, e }: { v: Visit; e: EnquiryX }) {
  const { step = 'measure' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { updEnq, set } = useStore();
  const fs = e.finalSurvey!;
  const items = itemsToCheck(e);
  const [m, setM] = useState<M[]>(() => items.map(i => { const c = fs.checks?.find(x => x.no === i.no); const [w, h] = parseSize(c?.checked); return { w: c?.w ?? (c && !fs.paper ? w : ''), h: c?.h ?? (c && !fs.paper ? h : ''), note: c?.note || '', photos: c?.photos || 0 }; }));
  const [site, setSite] = useState<Record<string, SiteCheck>>(fs.site || {});
  const [photos, setPhotos] = useState(fs.photos || 0);
  const [notes, setNotes] = useState(fs.notes || '');
  const [fitter, setFitter] = useState(fs.fitterNotes || '');
  const [signed, setSigned] = useState(!!fs.signed);
  const [signer, setSigner] = useState(fs.signedBy || e.name);
  const [noSign, setNoSign] = useState('');
  const [paper, setPaper] = useState<PaperReport | undefined>(fs.paper);
  const [sheet, setSheet] = useState<string | null>(null);
  const [openNote, setOpenNote] = useState<number[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  const checks: FinalCheck[] = items.map((i, k) => (paper
    ? { no: i.no, name: i.name, sales: i.size || '', checked: 'On the paperwork report', ok: !paper.changed.includes(i.no), note: m[k].note || undefined, photos: m[k].photos }
    : { no: i.no, name: i.name, sales: i.size || '', checked: sizeOf(m[k]), ok: !!sizeMatches(i.size || '', m[k]), note: m[k].note || undefined, photos: m[k].photos, w: m[k].w, h: m[k].h }));
  const typed = m.filter(x => x.w && x.h).length;
  const measured = paper ? items.length : typed;
  const changed = checks.filter((c, k) => (paper ? !c.ok : sizeMatches(c.sales, m[k]) === false));
  const answered = SITE_CHECKS.filter(([k]) => site[k]).length;
  const issues = SITE_CHECKS.filter(([k]) => site[k] && site[k].ok !== 'Yes');
  const allPhotos = photos + m.reduce((a, x) => a + x.photos, 0);
  const signOk = signed || noSign.trim().length > 3;
  const ready = measured === items.length && answered === SITE_CHECKS.length && allPhotos > 0 && signOk;
  const done: Record<string, boolean> = { measure: measured === items.length, checks: answered === SITE_CHECKS.length, photos: allPhotos > 0, sign: signOk, review: false };

  // Everything saves as you go, so nothing is lost if the phone closes.
  const save = () => updEnq(e.id, x => ({ finalSurvey: { ...x.finalSurvey!, checks, site, photos, notes, fitterNotes: fitter, paper, signed, signedBy: signed ? signer : undefined } }));
  useEffect(() => { if (first.current) { first.current = false; return; } save(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [m, site, photos, notes, fitter, paper, signed, signer]);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [step]);

  const idx = Math.max(0, STEPS.findIndex(s => s[0] === step));
  const go = (i: number) => nav(`/survey/${v.id}/${STEPS[i][0]}`, { replace: true });
  const upd = (k: number, p: Partial<M>) => setM(xs => xs.map((x, j) => (j === k ? { ...x, ...p } : x)));
  const same = (k: number) => { const [w, h] = parseSize(items[k].size); upd(k, { w, h }); };
  const usePaper = (p: PaperReport) => {
    const had = typed; const word = paper ? 'replaced' : 'added';
    setM(xs => xs.map(x => ({ ...x, w: '', h: '' }))); setPaper(p); setSheet(null);
    updEnq(e.id, {}, { kind: 'system', title: `Paperwork report ${word} · ${p.file}`, body: p.changed.length ? `${plural(p.changed.length, 'item')} different from the sales size.` : 'All sizes the same as sales.', who: me.name });
    toast(had ? `Report ${word} · ${had === 1 ? 'the typed size was' : `the ${had} typed sizes were`} removed` : `Report ${word} · sizes come from the report`);
  };
  const submit = () => {
    const ch = checks.filter(c => !c.ok);
    const summary = `${paper ? `Sizes from the paperwork report (${paper.file}) · ` : ''}${plural(checks.length, 'item')} measured · ${ch.length ? `${plural(ch.length, 'size')} changed (${ch.map(c => (paper ? `${c.no}. ${c.name}` : `${c.no}. ${c.sales} → ${c.checked}`)).join('; ')})` : 'all sizes match'}.${issues.length ? ` Site: ${issues.map(([k, l]) => `${l.toLowerCase()} — ${site[k].ok.toLowerCase()}${site[k].note ? ` (${site[k].note})` : ''}`).join('; ')}.` : ' No site problems.'} ${plural(allPhotos, 'photo')}. ${signed ? `Signed by ${signer}.` : `Not signed: ${noSign}.`}${notes ? ` Notes: ${notes}` : ''}`;
    updEnq(e.id, x => ({
      finalSurvey: { ...x.finalSurvey!, status: 'Done', checks, site, photos, paper, notes: notes || (ch.length ? `${plural(ch.length, 'size')} changed.` : 'All sizes confirmed.'), fitterNotes: fitter, signed, signedBy: signed ? signer : undefined, doneOn: short(TODAY), moveAsked: undefined },
      next: ch.length ? 'Revise quote in Framepoint' : 'Contract & financial readiness', nextDue: 'Today',
    }), { kind: 'note', title: `Final survey done · ${ch.length ? `${plural(ch.length, 'size')} changed` : 'all sizes match'}`, body: summary, who: me.name });
    set('appts', as => as.map(a => (a.enq === e.id && a.kind === 'Survey' && ['Booked', 'On site'].includes(a.status) ? { ...a, status: 'Done' } : a)));
    nav(`/done/survey/${v.id}`, { replace: true });
  };

  const foot = idx < 4
    ? <div className="row2">{idx > 0 && <button className="btn btn-outline" style={{ flex: '0 0 auto' }} onClick={() => go(idx - 1)} aria-label="Previous step"><IconChevronLeft size={20} /></button>}<button className="btn btn-primary" onClick={() => go(idx + 1)}>Next: {STEPS[idx + 1][1]}<IconArrowRight size={18} /></button></div>
    : <><button className="btn btn-primary btn-block" disabled={!ready} onClick={() => setSheet('confirm')}><IconSend size={18} />Submit survey</button>{!ready && <span className="tiny muted" style={{ textAlign: 'center' }}>Finish the steps marked in amber first.</span>}</>;

  return (
    <Screen scrollRef={scroller} header={<>
      <Header back onBack={() => nav(`/visit/${v.id}`)} over={`Step ${idx + 1} of 5`} title={STEPS[idx][1]} right={<button className="btn btn-outline btn-xs" onClick={() => { save(); toast('Saved · carry on any time from Today'); nav('/'); }}><IconDeviceFloppy size={15} />Save</button>} />
      <div className="prog">{STEPS.map(([s], i) => <span key={s} className={i === idx ? 'now' : done[s] ? 'done' : ''} />)}</div>
    </>} foot={foot}>
      <div className="pad" style={{ paddingTop: 6 }}>

        {step === 'measure' && <>
          <div className="vstack" style={{ gap: 4 }}><span className="small t2">Type the size in millimetres. Within {TOL}mm of the salesperson's size counts as the same.</span></div>
          {paper ? <>
            <div className="alert ok"><IconFileText size={17} /><span><b>The sizes come from your paperwork report.</b> Typed sizes are not used. Remove the report to type them instead.</span></div>
            <PaperCard p={paper} onReplace={() => setSheet('paper')} onRemove={() => { setPaper(undefined); updEnq(e.id, {}, { kind: 'system', title: 'Paperwork report removed · sizes will be typed in', who: me.name }); toast('Report removed · type each size instead'); }} />
          </> : (
            <button className="file" onClick={() => setSheet('paper')}>
              <span className="icircle jade"><IconUpload size={20} /></span>
              <span className="grow vstack" style={{ gap: 2 }}><span className="row-title">Upload paperwork report</span><span className="tiny muted">Wrote it on paper? Add a photo instead of typing</span></span><IconChevronRight size={18} color="#a5b2af" />
            </button>
          )}
          {!paper && <div className="between"><span className="tiny muted"><b style={{ color: 'var(--text)' }}>{measured} of {items.length}</b> measured</span><button className="link" onClick={() => { items.forEach((_, k) => { if (!m[k].w || !m[k].h) same(k); }); toast('Empty sizes filled with the sales sizes'); }}><IconCopy size={15} />Fill the rest with sales sizes</button></div>}
          {items.map((i, k) => {
            const r = paper ? !paper.changed.includes(i.no) : sizeMatches(i.size || '', m[k]);
            const [dw, dh] = !paper && r === false ? sizeDiff(i.size || '', m[k]) : [0, 0];
            const noteOpen = openNote.includes(i.no) || !!m[k].note;
            return (
              <div key={i.no} className={`mrow ${r === false ? 'changed' : r ? 'ok' : ''}`}>
                <div className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <Thumb src={i.photo || 'window'} size={44} r={10} />
                  <div className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 14.5 }}>{i.no}. {i.name}{i.qty > 1 ? ` × ${i.qty}` : ''}</b><span className="tiny muted">{i.product}</span></div>
                  {r === undefined ? <Tag tone="grey">To measure</Tag> : r ? <Tag tone="ok" icon={<IconCheck size={12} stroke={3} />}>Same</Tag> : <Tag tone="warn" icon={<IconAlertTriangle size={12} />}>Changed</Tag>}
                </div>
                <div className="salesbox"><span>Sales measured <b style={{ color: 'var(--text)' }}>{i.size}</b></span>{!paper && r === undefined && <button className="btn btn-outline btn-xs" onClick={() => same(k)}>Same</button>}</div>
                {paper ? <span className="small t2">{r ? 'Same size · on the paperwork report' : 'Different · see the paperwork report'}</span> : (
                  <div className="wh">
                    <Field label="Width (mm)"><input className="input" inputMode="numeric" value={m[k].w} placeholder="0" onChange={x => upd(k, { w: x.target.value.replace(/\D/g, '').slice(0, 5) })} aria-label={`Width of item ${i.no}`} /></Field>
                    <span className="x">×</span>
                    <Field label="Height (mm)"><input className="input" inputMode="numeric" value={m[k].h} placeholder="0" onChange={x => upd(k, { h: x.target.value.replace(/\D/g, '').slice(0, 5) })} aria-label={`Height of item ${i.no}`} /></Field>
                  </div>
                )}
                {r === false && !paper && <span className="small" style={{ color: '#8a6400' }}>{dw ? `Width ${dw > 0 ? '+' : ''}${dw}mm` : ''}{dw && dh ? ' · ' : ''}{dh ? `Height ${dh > 0 ? '+' : ''}${dh}mm` : ''} · {salespersonOf(e).split(' ')[0]} will revise the quote</span>}
                {noteOpen && <input className="input" style={{ height: 44, fontSize: 14 }} placeholder="e.g. Reveal is out of square by 8mm" value={m[k].note} onChange={x => upd(k, { note: x.target.value })} aria-label={`Note for item ${i.no}`} />}
                <div className="hstack" style={{ gap: 8 }}>
                  {!noteOpen && <button className="btn btn-grey btn-xs" onClick={() => setOpenNote(n => [...n, i.no])}><IconNote size={14} />Add note</button>}
                  <button className="btn btn-grey btn-xs" onClick={() => { upd(k, { photos: m[k].photos + 1 }); toast('Photo added'); }}><IconCamera size={14} />Photo{m[k].photos ? ` · ${m[k].photos}` : ''}</button>
                </div>
              </div>
            );
          })}
          {changed.length > 0 && <div className="alert warn"><IconAlertTriangle size={17} /><span><b>{changed.length === 1 ? '1 size is' : `${changed.length} sizes are`} different.</b> When you submit, {salespersonOf(e)} revises the quote in Framepoint before the office orders.</span></div>}
        </>}

        {step === 'checks' && <>
          <div className="vstack" style={{ gap: 4 }}><span className="small t2">Answer every question. Anything "No" or "Not sure" goes to the office and the fitters.</span></div>
          {answered < SITE_CHECKS.length && <button className="btn btn-outline btn-sm" onClick={() => { setSite(s => { const n = { ...s }; SITE_CHECKS.forEach(([k]) => { if (!n[k]) n[k] = { ok: 'Yes' }; }); return n; }); toast('Every unanswered check set to Yes'); }}><IconListCheck size={16} />Everything else is fine · answer Yes</button>}
          {e.survey?.notes && <div className="alert warn"><IconAlertTriangle size={17} /><span>{salespersonOf(e).split(' ')[0]} asked: {e.survey.notes}</span></div>}
          {SITE_CHECKS.map(([k, l], n) => (
            <div key={k} className="card tight" style={site[k] && site[k].ok !== 'Yes' ? { borderColor: '#f0cf73' } : undefined}>
              <div className="hstack" style={{ gap: 10, alignItems: 'flex-start' }}><span className="tile" style={{ width: 26, height: 26, borderRadius: 8, background: site[k] ? (site[k].ok === 'Yes' ? '#e3f6ec' : '#fdf3d9') : 'var(--bg)', color: site[k] ? (site[k].ok === 'Yes' ? 'var(--ok)' : '#8a6400') : 'var(--muted)', fontSize: 12, fontWeight: 700 }}>{site[k] ? <IconCheck size={14} stroke={3} /> : n + 1}</span><b style={{ fontSize: 14, flex: 1 }}>{l}</b></div>
              <div className="yn">{(['Yes', 'No', 'Not sure'] as const).map(o => <button key={o} type="button" aria-label={`${l}: ${o}`} className={site[k]?.ok === o ? (o === 'Yes' ? 'yes' : 'no') : ''} onClick={() => setSite(s => ({ ...s, [k]: { ...(s[k] || {}), ok: o } }))}>{o}</button>)}</div>
              {site[k] && site[k].ok !== 'Yes' && <input className="input" style={{ height: 44, fontSize: 14 }} placeholder="What did you find? The fitters will read this." value={site[k].note || ''} onChange={x => setSite(s => ({ ...s, [k]: { ...s[k], note: x.target.value } }))} />}
            </div>
          ))}
        </>}

        {step === 'photos' && <>
          <div className="vstack" style={{ gap: 4 }}><span className="small t2">The front, the back and anything the fitters should know about. At least one photo.</span></div>
          <div className="card"><div className="between"><span className="row-title">Whole property</span><span className="tiny muted">{plural(photos, 'photo')}</span></div><PhotoGrid n={photos} seed={0} onAdd={() => { setPhotos(p => p + 1); toast('Photo added'); }} onRemove={() => setPhotos(p => Math.max(0, p - 1))} /></div>
          {items.map((i, k) => (
            <div key={i.no} className="card"><div className="between"><span className="row-title">{i.no}. {i.name}</span><span className="tiny muted">{plural(m[k].photos, 'photo')}</span></div><PhotoGrid n={m[k].photos} seed={k + 1} onAdd={() => { upd(k, { photos: m[k].photos + 1 }); toast('Photo added'); }} onRemove={() => upd(k, { photos: Math.max(0, m[k].photos - 1) })} /></div>
          ))}
        </>}

        {step === 'sign' && <>
          <div className="vstack" style={{ gap: 4 }}><span className="small t2">The customer signs to say the sizes and the work were explained to them.</span></div>
          <Field label="Notes for the office (optional)"><textarea className="textarea" value={notes} onChange={x => setNotes(x.target.value)} placeholder="e.g. Customer wants the back door to open out" /></Field>
          <Field label="Notes for the fitters (optional)"><textarea className="textarea" value={fitter} onChange={x => setFitter(x.target.value)} placeholder="e.g. Bring a 3-step ladder. Dog in the kitchen." /></Field>
          <div className="card">
            <span className="hstack" style={{ gap: 8 }}><IconSignature size={20} color="#0b6e5c" /><b style={{ fontSize: 15 }}>Customer signature</b></span>
            <Field label="Customer name"><input className="input" value={signer} onChange={x => setSigner(x.target.value)} /></Field>
            <SignaturePad value={signed} onChange={setSigned} name={signer} />
            {!signed && <Field label="Customer can't sign? Say why"><input className="input" value={noSign} onChange={x => setNoSign(x.target.value)} placeholder="e.g. Only the tenant was in" /></Field>}
          </div>
        </>}

        {step === 'review' && <>
          <div className="vstack" style={{ gap: 4 }}><span className="small t2">Tap a line to go back to it.</span></div>
          <div className="card flush"><div className="list">
            {([[IconRuler, 'Sizes', paper ? `Paperwork report · ${changed.length ? `${changed.length} different` : 'all the same as sales'}` : measured === items.length ? (changed.length ? `${changed.length} changed · ${items.length - changed.length} the same` : 'All the same as sales') : `${items.length - measured} still to measure`, done.measure, 0], [IconListCheck, 'Site checks', answered === SITE_CHECKS.length ? (issues.length ? `${issues.length} to look at` : 'No problems found') : `${SITE_CHECKS.length - answered} not answered`, done.checks, 1], [IconPhoto, 'Photos', allPhotos ? plural(allPhotos, 'photo') : 'No photos yet', done.photos, 2], [IconSignature, 'Signature', signed ? `Signed by ${signer}` : noSign ? `Not signed: ${noSign}` : 'Not signed yet', done.sign, 3]] as [any, string, string, boolean, number][]).map(([I, l, val, ok, i]) => (
              <button key={l} className="li" onClick={() => go(i)}>
                <span className="ic" style={ok ? { background: '#e3f6ec', color: 'var(--ok)' } : { background: '#fdf3d9', color: '#8a6400' }}>{ok ? <IconCircleCheck size={20} /> : <I size={19} />}</span>
                <span className="vstack grow" style={{ gap: 1 }}><b style={{ fontSize: 14 }}>{l}</b><span className="small t2">{val}</span></span>
                <IconChevronRight size={18} className="chev" />
              </button>
            ))}
          </div></div>
          {paper && <PaperCard p={paper} />}
          {changed.length > 0 && <div className="card tight"><b style={{ fontSize: 14 }}>Sizes that changed</b>{changed.map(c => <span key={c.no} className="small t2">{c.no}. {c.name}: {c.sales} → <b style={{ color: 'var(--text)' }}>{paper ? 'see paperwork report' : c.checked}</b></span>)}</div>}
          {issues.length > 0 && <div className="card tight"><b style={{ fontSize: 14 }}>Site checks to look at</b>{issues.map(([k, l]) => <span key={k} className="small t2">• {l} — <b style={{ color: '#8a6400' }}>{site[k].ok}</b>{site[k].note ? ` (${site[k].note})` : ''}</span>)}</div>}
          {ready && (changed.length ? <div className="alert info"><IconInfoCircle size={17} />{salespersonOf(e)} is asked to revise the quote. The office orders with your sizes once the new version is agreed.</div> : <div className="alert ok"><IconCircleCheck size={17} />All sizes match. The office can get the order ready.</div>)}
        </>}
      </div>

      {sheet === 'paper' && <PaperSheet items={items} customer={e.name} typed={typed} current={paper} onClose={() => setSheet(null)} onSave={usePaper} />}
      {sheet === 'confirm' && (
        <Sheet title="Submit the final survey?" sub={`${e.name} · ${plural(items.length, 'item')}`} onClose={() => setSheet(null)}
          footer={<><button className="btn btn-grey" onClick={() => setSheet(null)}>Keep working</button><button className="btn btn-primary" onClick={submit}><IconSend size={18} />Submit</button></>}>
          <span className="t2">It goes to the office straight away. You can't change it after this, but you can message the office.</span>
          {changed.length ? <div className="alert warn"><IconAlertTriangle size={17} />{plural(changed.length, 'size')} changed · {salespersonOf(e)} revises the quote first.</div> : <div className="alert ok"><IconCircleCheck size={17} />All sizes match · the office can order.</div>}
        </Sheet>
      )}
    </Screen>
  );
}

/* ================= Done ================= */
export function Done() {
  const { kind, id } = useParams();
  const nav = useNavigate();
  const visits = useMyVisits();
  const v = visits.find(x => x.id === id && x.status === 'Submitted');
  const nextV = visits.find(x => x.date === TODAY && isOpenVisit(x));
  if (!v) return <Navigate to="/" replace />;
  const survey = kind === 'survey';
  const changed = survey ? v.changed || 0 : 0;
  const advice = !survey && v.snag?.status === 'Fixed';
  return (
    <Screen bg="#fff">
      <div className="success" style={{ minHeight: 640 }}>
        <span className={`ring ${changed ? 'warn' : ''}`}>{changed ? <IconAlertTriangle size={48} /> : <IconCircleCheck size={52} />}</span>
        <h2>{survey ? 'Survey submitted' : 'Findings submitted'}</h2>
        <span className="t2" style={{ fontSize: 15 }}>
          {survey ? (changed ? `${plural(changed, 'size')} changed. ${salespersonOf(v.e)} revises the quote in Framepoint, then the office orders.` : 'All sizes match. The office can get the order ready.')
            : advice ? 'Closed with your advice. No visit is needed.' : 'The office books the fitter with the right part.'}
        </span>
        <div className="card flat tight" style={{ width: '100%', textAlign: 'left' }}>
          <div className="hstack" style={{ gap: 12 }}><Thumb src={v.photo} size={44} r={10} /><span className="vstack grow" style={{ gap: 1 }}><b>{v.customer}</b><span className="tiny muted">{v.kind} · submitted {nowTime()}</span></span><Tag tone={changed ? 'warn' : 'ok'}>{survey ? (changed ? `${changed} changed` : 'All match') : advice ? 'Advice given' : 'Inspected'}</Tag></div>
        </div>
        <div className="vstack" style={{ width: '100%', gap: 8, marginTop: 8 }}>
          {nextV && <button className="btn btn-primary btn-block" onClick={() => nav(nextV.to)}><IconArrowRight size={18} />Next visit · {nextV.customer} {startOf(nextV.time)}</button>}
          <button className={`btn ${nextV ? 'btn-outline' : 'btn-primary'} btn-block`} onClick={() => nav(survey ? `/report/${v.id}` : v.to)}>{survey ? 'View the report' : 'View my findings'}</button>
          <button className="btn btn-ghost btn-block" onClick={() => nav('/')}><IconHome size={18} />Back to Today</button>
        </div>
      </div>
    </Screen>
  );
}

/* ================= Report ================= */
export function Report() {
  const { id } = useParams();
  const toast = useToast();
  const v = useMyVisits().find(x => x.kind === 'Final survey' && x.id === id && x.status === 'Submitted');
  if (!v || !v.e) return <Navigate to={id ? `/visit/${id}` : '/visits'} replace />;
  const e = v.e; const fs = e.finalSurvey!;
  const ch = (fs.checks || []).filter(c => !c.ok);
  const photos = (fs.photos || 0) + (fs.checks || []).reduce((a, c) => a + (c.photos || 0), 0);
  return (
    <Screen header={<Header back over={`${e.name} · ${e.jobId || e.id}`} title="Final survey report" />} foot={<button className="btn btn-primary btn-block" onClick={() => toast(`Final survey ${e.jobId || e.id}.pdf downloaded`)}><IconDownload size={18} />Download report (PDF)</button>}>
      <div className="pad">
        <div className="card" style={{ alignItems: 'center', textAlign: 'center', gap: 10 }}>
          <span className="tile" style={{ width: 60, height: 60, borderRadius: '50%', background: ch.length ? 'var(--warn-bg)' : 'var(--ok-bg)', color: ch.length ? 'var(--warn)' : 'var(--ok)' }}>{ch.length ? <IconAlertTriangle size={26} /> : <IconCircleCheck size={28} />}</span>
          <b style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.5 }}>{ch.length ? `${plural(ch.length, 'size')} changed` : 'All sizes match'}</b>
          <span className="small muted">{ch.length ? `${salespersonOf(e)} revises the quote before the office orders.` : 'The office can get the order ready.'}</span>
        </div>
        <div className="card" style={{ padding: '6px 20px' }}><div className="kvs">
          <div><span>Surveyor</span><b>{staffById(fs.surveyor)?.name}</b></div>
          <div><span>Visit</span><b>{fmtDate(fs.date)} · {startOf(fs.time)}</b></div>
          <div><span>Submitted</span><b>{fs.doneOn}</b></div>
          <div><span>Customer signature</span><b>{fs.signed ? fs.signedBy || e.name : 'Not signed'}</b></div>
          <div><span>Photos</span><b>{photos}</b></div>
          <div><span>Quote</span><b>{e.ops?.revision ? `${e.ops.revision.from} → ${e.ops.revision.to}` : e.survey?.fp?.ref || '—'}</b></div>
        </div></div>
        {fs.paper && <><div className="sec"><h3>Paperwork report</h3><span className="tiny muted">Uploaded on site</span></div><PaperCard p={fs.paper} /></>}
        <div className="sec"><h3>Sizes</h3></div>
        <div className="card flush"><div className="list">
          {(fs.checks || []).map(c => (
            <div key={c.no} className="li" style={{ alignItems: 'flex-start' }}>
              <span className="tile" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--field)', fontSize: 13, fontWeight: 600 }}>{c.no}</span>
              <span className="vstack grow" style={{ gap: 2 }}><span className="row-title">{c.name}</span><span className="tiny muted">Sales {c.sales}</span><span className="tiny t2">Yours <b>{c.checked}</b></span>{c.note && <span className="tiny muted">“{c.note}”</span>}</span>
              {c.ok ? <Tag tone="ok">Matches</Tag> : <Tag tone="warn">Changed</Tag>}
            </div>
          ))}
        </div></div>
        {fs.site && <>
          <div className="sec"><h3>Site checks</h3></div>
          <div className="card flush"><div className="list">
            {SITE_CHECKS.map(([k, l]) => fs.site![k] && <div key={k} className="li" style={{ alignItems: 'flex-start' }}><span className="grow small">{l}{fs.site![k].note ? <span className="muted"> — {fs.site![k].note}</span> : ''}</span><Tag tone={fs.site![k].ok === 'Yes' ? 'ok' : 'warn'}>{fs.site![k].ok}</Tag></div>)}
          </div></div>
        </>}
        {photos > 0 && <><div className="sec"><h3>Photos</h3><span className="tiny muted">{photos}</span></div><PhotoGrid n={photos} disabled max={6} /></>}
        {(fs.fitterNotes || fs.notes) && <div className="card tight">{fs.notes && <><span className="tiny b muted">NOTES FOR THE OFFICE</span><span className="small t2">{fs.notes}</span></>}{fs.fitterNotes && <><span className="tiny b muted">NOTES FOR THE FITTERS</span><span className="small t2">{fs.fitterNotes}</span></>}</div>}
        <Link to={`/history/${e.id}`} className="btn btn-grey btn-sm"><IconHistory size={16} />History</Link>
      </div>
    </Screen>
  );
}

/* ================= History ================= */
const commIcon: Record<string, [any, string]> = { 'email-out': [IconMailForward, '#0b6e5c'], 'email-in': [IconMail, '#0b6e5c'], call: [IconPhoneCall, '#9a6f00'], note: [IconNotes, '#3a4a4a'], system: [IconSettings, '#6b7a78'], reminder: [IconBellRinging, '#d64545'] };
export function History() {
  const { id } = useParams();
  const { enquiries } = useStore();
  const e = enquiries.find(x => x.id === id);
  if (!e) return <Navigate to="/visits" replace />;
  return (
    <Screen header={<Header back over={`${e.name} · ${e.jobId || e.id}`} title="History" />}>
      <div className="pad">
        <div className="card">
          {(e.comms || []).map((c, i, a) => { const [I, col] = commIcon[c.kind] || commIcon.system; return (
            <div key={c.id} className="hstack" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span className="vstack" style={{ alignItems: 'center', gap: 0, alignSelf: 'stretch' }}><span className="tile" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--field)', color: col }}><I size={16} /></span>{i < a.length - 1 && <span style={{ flex: 1, width: 2, background: 'var(--border)', margin: '4px 0' }} />}</span>
              <span className="vstack grow" style={{ gap: 3, paddingBottom: 12 }}><b style={{ fontSize: 13.5 }}>{c.title}</b><span className="tiny muted">{c.who} · {c.when}</span>{c.body && <span className="small t2" style={{ background: 'var(--field)', borderRadius: 14, padding: '10px 12px' }}>{c.body}</span>}</span>
            </div>
          ); })}
        </div>
      </div>
    </Screen>
  );
}
