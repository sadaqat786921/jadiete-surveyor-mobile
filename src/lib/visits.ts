// What the surveyor sees: only the visits the office booked for them — final surveys
// (check every size before anything is ordered) and aftercare / snag inspections.
// Everything saved here goes onto the same customer record the office and sales use.
import { useMemo } from 'react';
import { me, staffById, IMG } from '../data/mock';
import { useStore, TODAY, addDays, fmtDate, EnquiryX } from '../data/store';
import type { FPItem } from '../data/framepoint';
import type { Comm } from '../data/lifecycle';

export type VisitKind = 'Final survey' | 'Inspection';
export type VisitStatus = 'Booked' | 'On my way' | 'On site' | 'Submitted' | 'No access';
export type Visit = { id: string; kind: VisitKind; e?: EnquiryX; snag?: any; date: string; time: string; status: VisitStatus; to: string; customer: string; address: string; photo: string; items: number; reason?: string; changed?: number; moveAsked?: string };

export const statusTone: Record<VisitStatus, string> = { Booked: 'jade', 'On my way': 'warn', 'On site': 'warn', Submitted: 'ok', 'No access': 'err' };
export const nowTime = () => new Date().toTimeString().slice(0, 5);
export const short = (iso: string) => fmtDate(iso, { day: '2-digit', month: 'short' });
export const img = (k?: string) => IMG[(k || 'house') as keyof typeof IMG] || IMG.house;
export const startOf = (t: string) => (t || '').split(' ')[0];
export const town = (a: string) => { const p = a.split(', '); return p.length > 2 ? p[p.length - 2] : p[p.length - 1]; };
export const plural = (n: number, w: string, ws = w + 's') => `${n} ${n === 1 ? w : ws}`;
export const maps = (a: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isoOf = (d?: string) => { const m = /(\d{1,2}) (\w{3})/.exec(d || ''); return m ? `2026-${String(MON.indexOf(m[2]) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''; };
export const dayLabel = (iso: string) => (iso === TODAY ? 'Today' : iso === addDays(TODAY, 1) ? 'Tomorrow' : iso === addDays(TODAY, -1) ? 'Yesterday' : fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long' }));

/** The frames to measure: Framepoint items without services (FENSA, waste). */
export const itemsToCheck = (e?: EnquiryX): FPItem[] => (e?.survey?.fp?.items || []).filter(i => !i.service);
export const frameCount = (e?: EnquiryX) => itemsToCheck(e).reduce((a, i) => a + i.qty, 0);
export const recordForJob = (enquiries: EnquiryX[], job?: string) => enquiries.find(x => x.type === 'Sales' && x.jobId && x.jobId === job);
export const salespersonOf = (e?: EnquiryX) => staffById(e?.assigned)?.name || '—';
export const isOpenVisit = (v: Visit) => ['Booked', 'On my way', 'On site'].includes(v.status);

export function useMyVisits(): Visit[] {
  const { enquiries, snags, appts, surveys } = useStore();
  return useMemo(() => {
    const out: Visit[] = [];
    enquiries.filter(e => e.finalSurvey?.surveyor === me.id).forEach(e => {
      const fs = e.finalSurvey!;
      const status: VisitStatus = fs.status === 'Done' ? 'Submitted' : fs.status === 'Started' ? 'On site' : fs.onWay ? 'On my way' : 'Booked';
      out.push({ id: e.id, kind: 'Final survey', e, date: fs.date, time: fs.time, status, to: `/visit/${e.id}`, customer: e.name, address: `${e.address}, ${e.postcode}`, photo: e.photo, items: frameCount(e), changed: (fs.checks || []).filter(c => !c.ok).length, moveAsked: fs.moveAsked });
    });
    (surveys as any[]).filter(s => s.surveyor === me.id && s.status === 'No access').forEach(s => {
      const e = enquiries.find(x => x.id === s.job);
      out.push({ id: s.id, kind: (s.kind as VisitKind) || 'Final survey', e, date: s.iso || isoOf(s.date), time: s.time, status: 'No access', to: `/missed/${s.id}`, customer: s.customer, address: s.address, photo: s.photo, items: frameCount(e), reason: s.reason });
    });
    (snags as any[]).filter(x => x.owner === me.name || x.inspectedBy === me.name).forEach(x => {
      const a = appts.find(ap => ap.snag === x.id && ap.status !== 'Missed');
      const e = recordForJob(enquiries, x.job);
      const status: VisitStatus = x.inspected ? 'Submitted' : x.inspStarted ? 'On site' : x.inspOnWay ? 'On my way' : 'Booked';
      out.push({ id: x.id, kind: 'Inspection', e, snag: x, date: a?.date || x.inspected?.iso || TODAY, time: a?.time || '', status, to: `/inspection/${x.id}`, customer: x.customer, address: e ? `${e.address}, ${e.postcode}` : '', photo: x.photo, items: 1, moveAsked: x.moveAsked });
    });
    return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [enquiries, snags, appts, surveys]);
}

/** Things the surveyor should know about (the bell). */
export type Alert = { id: string; title: string; sub: string; to: string; tone: string; icon: 'survey' | 'tool' | 'alert' | 'cal' | 'msg' };
export function useAlerts(): Alert[] {
  const visits = useMyVisits();
  return useMemo(() => {
    const out: Alert[] = [];
    visits.filter(v => v.status === 'On site').forEach(v => out.push({ id: 'p' + v.id, title: `Not finished: ${v.customer}`, sub: 'You started this visit but have not submitted it', to: v.to, tone: 'err', icon: 'alert' }));
    visits.filter(v => v.date === TODAY && isOpenVisit(v) && v.status !== 'On site').forEach(v => out.push({ id: 't' + v.id, title: `Today ${startOf(v.time)} · ${v.customer}`, sub: `${v.kind} · ${town(v.address)}`, to: v.to, tone: 'jade', icon: v.kind === 'Final survey' ? 'survey' : 'tool' }));
    visits.filter(v => v.moveAsked && isOpenVisit(v)).forEach(v => out.push({ id: 'm' + v.id, title: `Waiting for the office: ${v.customer}`, sub: 'You asked the office to move this visit', to: v.to, tone: 'warn', icon: 'cal' }));
    visits.filter(v => v.date > TODAY && isOpenVisit(v)).slice(0, 3).forEach(v => out.push({ id: 'b' + v.id, title: `Booked for you: ${v.customer}`, sub: `${fmtDate(v.date)} · ${v.time} · ${v.kind}`, to: v.to, tone: 'ok', icon: 'cal' }));
    visits.filter(v => v.kind === 'Final survey' && v.status === 'Submitted' && (v.changed || 0) > 0 && v.e?.ops?.revision).forEach(v => out.push({ id: 'r' + v.id, title: `Quote revised for ${v.customer}`, sub: `${v.e?.ops?.revision?.from} → ${v.e?.ops?.revision?.to} after your survey`, to: v.to, tone: 'ok', icon: 'survey' }));
    return out;
  }, [visits]);
}

/* ---------- Messages ---------- */
export const commTime = (w: string) => { const m = /(\d{1,2}) (\w{3}),? ?(\d{1,2})?:?(\d{2})?/.exec(w || ''); if (!m) return 0; return (MON.indexOf(m[2]) + 1) * 1e6 + +m[1] * 1e4 + (+(m[3] || 0)) * 100 + +(m[4] || 0); };
export const isTalk = (c: Comm) => ['email-in', 'email-out', 'call', 'note'].includes(c.kind);
export const needsReply = (e: { comms?: Comm[] }) => { const t = (e.comms || []).filter(c => c.kind === 'email-in' || c.kind === 'email-out' || c.kind === 'call'); return t[0]?.kind === 'email-in'; };
/** One conversation per customer I visit. */
export function useConversations() {
  const visits = useMyVisits();
  return useMemo(() => {
    const seen = new Set<string>();
    const rows: { e: EnquiryX; v: Visit }[] = [];
    visits.forEach(v => { if (v.e && !seen.has(v.e.id)) { seen.add(v.e.id); rows.push({ e: v.e, v: visits.find(x => x.e?.id === v.e!.id && x.status !== 'No access') || v }); } });
    return rows.filter(r => (r.e.comms || []).some(isTalk)).sort((a, b) => commTime((b.e.comms || []).find(isTalk)!.when) - commTime((a.e.comms || []).find(isTalk)!.when));
  }, [visits]);
}

/* ---------- Actions shared by Today, the visit screens and the sheets ---------- */
export function useVisitActions() {
  const { updEnq, set } = useStore();
  const onWay = (v: Visit, at: string) => {
    const msg = arrivalText(v, at);
    if (v.kind === 'Final survey' && v.e) updEnq(v.e.id, x => ({ finalSurvey: { ...x.finalSurvey!, onWay: nowTime() } }), { kind: 'email-out', title: `On my way · arriving about ${at}`, body: msg, who: me.name });
    else { set('snags', ss => ss.map(x => (x.id === v.id ? { ...x, inspOnWay: nowTime() } : x))); if (v.e) updEnq(v.e.id, {}, { kind: 'email-out', title: `On my way · arriving about ${at}`, body: msg, who: me.name }); }
  };
  const start = (v: Visit) => {
    if (v.kind === 'Final survey' && v.e) {
      updEnq(v.e.id, x => ({ finalSurvey: { ...x.finalSurvey!, status: 'Started', startedAt: nowTime() } }), { kind: 'system', title: `${me.name} arrived for the final survey`, who: me.name });
      set('appts', as => as.map(a => (a.enq === v.e!.id && a.kind === 'Survey' && a.status === 'Booked' ? { ...a, status: 'On site' } : a)));
    } else {
      set('snags', ss => ss.map(s => (s.id === v.id ? { ...s, inspStarted: nowTime() } : s)));
      if (v.e) updEnq(v.e.id, {}, { kind: 'system', title: `${me.name} arrived to inspect: ${v.snag?.title}`, who: me.name });
    }
  };
  const cantMake = (v: Visit, text: string) => {
    if (v.kind === 'Final survey' && v.e) updEnq(v.e.id, x => ({ finalSurvey: { ...x.finalSurvey!, moveAsked: text } }), { kind: 'note', title: `${me.first} can't make the final survey on ${fmtDate(v.date)}`, body: text, who: me.name });
    else { set('snags', ss => ss.map(x => (x.id === v.id ? { ...x, moveAsked: text } : x))); if (v.e) updEnq(v.e.id, {}, { kind: 'note', title: `${me.first} can't make the inspection on ${fmtDate(v.date)}`, body: text, who: me.name }); }
  };
  const noAccess = (v: Visit, reason: string) => {
    set('surveys', ss => [{ id: 'NA-' + Date.now(), job: v.e?.id || '', snag: v.kind === 'Inspection' ? v.id : undefined, customer: v.customer, address: v.address, date: short(v.date), time: v.time, surveyor: me.id, status: 'No access', tone: 'err', photo: v.photo, kind: v.kind, reason, iso: v.date } as any, ...ss]);
    set('appts', as => as.map(a => (((v.kind === 'Final survey' && a.enq === v.e?.id && a.kind === 'Survey') || a.snag === v.id) && a.status === 'Booked' ? { ...a, status: 'Missed' } : a)));
    if (v.kind === 'Final survey' && v.e) updEnq(v.e.id, { finalSurvey: undefined, next: 'Rebook final survey', nextDue: 'Today' }, { kind: 'note', title: 'Final survey · customer not in', body: `${reason} Please rebook.`, who: me.name });
    else { set('snags', ss => ss.map(x => (x.id === v.id ? { ...x, status: 'Open', tone: 'err', owner: 'Aftercare team', inspOnWay: undefined, inspStarted: undefined } : x))); if (v.e) updEnq(v.e.id, {}, { kind: 'note', title: 'Inspection · customer not in', body: `${reason} Please rebook.`, who: me.name }); }
  };
  return { onWay, start, cantMake, noAccess };
}
export const arrivalText = (v: Visit, at: string) => `Hello ${v.customer}, this is ${me.name} from Jadeite Glazing. I am on my way for your ${v.kind === 'Final survey' ? 'final survey' : 'visit'} and should be with you at about ${at || '…'}.`;
export const suggestedArrival = () => { const d = new Date(); d.setMinutes(Math.ceil((d.getMinutes() + 20) / 5) * 5); return d.toTimeString().slice(0, 5); };

/* ---------- Final survey rules ---------- */
export const SITE_CHECKS: [string, string][] = [
  ['access', 'Every opening can be reached easily'],
  ['parking', 'A van can park close by'],
  ['lintels', 'Lintels and brickwork above the openings are sound'],
  ['reveals', 'Reveals are square and in good condition'],
  ['removal', 'Old frames can come out without damage'],
  ['asbestos', 'Nothing that could be asbestos (old soffits, panels)'],
  ['scaffold', 'Can be fitted without scaffolding'],
  ['escape', 'Bedroom windows are big enough for a fire escape'],
  ['safety', 'Safety glass is planned where it is needed (doors, low glass)'],
];
export const TOL = 5; // sizes within 5mm count as the same
export const parseSize = (s?: string) => { const m = /(\d+)\D+(\d+)/.exec(s || ''); return m ? [m[1], m[2]] : ['', '']; };
export type M = { w: string; h: string; note: string; photos: number };
export const sizeOf = (m: M) => (m.w && m.h ? `${m.w}mm x ${m.h}mm` : '');
export const sizeDiff = (sales: string, m: M) => { const [sw, sh] = parseSize(sales).map(Number); return [Number(m.w) - sw, Number(m.h) - sh]; };
export const sizeMatches = (sales: string, m: M) => { if (!m.w || !m.h) return undefined; const [dw, dh] = sizeDiff(sales, m); return Math.abs(dw) <= TOL && Math.abs(dh) <= TOL; };
export const CAUSES = ['Needs adjusting', 'Part needed', 'Glass unit failed', 'Seal or silicone', 'Not a fault — advice given'];

/** A picture of a filled-in paper survey sheet, used for "Use a sample report" in the demo. */
export function sampleSheet(items: FPItem[], customer: string) {
  const x = (t: string) => t.replace(/&/g, 'and').replace(/</g, '').replace(/>/g, '');
  customer = x(customer);
  const rows = items.map((i, k) => {
    const y = 150 + k * 46;
    return `<text x="40" y="${y}" font-size="15" fill="#3a4a4a" font-family="Arial">${i.no}. ${x(i.name)}${i.qty > 1 ? ` x ${i.qty}` : ''}</text><text x="420" y="${y}" font-size="19" fill="#1d3fa8" font-family="Segoe Print, Comic Sans MS, cursive">${(i.size || '').replace(/mm/g, '')}</text><line x1="40" y1="${y + 14}" x2="640" y2="${y + 14}" stroke="#d5dcda"/>`;
  }).join('');
  const h = 230 + items.length * 46;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="680" height="${h}" viewBox="0 0 680 ${h}"><rect width="680" height="${h}" fill="#fdfcf7"/><rect x="16" y="16" width="648" height="${h - 32}" fill="none" stroke="#c9d3d0"/><text x="40" y="58" font-size="22" font-weight="700" fill="#0b1f1b" font-family="Arial">Jadeite Glazing · Final survey sheet</text><text x="40" y="88" font-size="14" fill="#6b7a78" font-family="Arial">Customer: ${customer} · Surveyor: ${me.name}</text><text x="40" y="122" font-size="12" fill="#6b7a78" font-family="Arial">ITEM</text><text x="420" y="122" font-size="12" fill="#6b7a78" font-family="Arial">WIDTH x HEIGHT (mm)</text>${rows}<text x="40" y="${h - 44}" font-size="13" fill="#6b7a78" font-family="Arial">Customer signature</text><path d="M180 ${h - 48} c20 -22 34 10 52 -6 s28 -18 40 4 s30 6 48 -10" stroke="#1d3fa8" stroke-width="2" fill="none"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
