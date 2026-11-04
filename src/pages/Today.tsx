// Today: where to go, in what order, and what to check when you get there.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconBell, IconSearch, IconClock, IconMapPin, IconRuler, IconTool, IconPhone, IconCar, IconDots, IconPlayerPlay, IconArrowRight, IconArrowUpRight,
  IconAlertTriangle, IconChevronRight, IconCalendarEvent, IconBeach, IconMessage, IconRoute, IconChevronDown, IconCircleCheck,
} from '@tabler/icons-react';
import { Screen, Tag, Avatar, Thumb, useToast } from '../ui/kit';
import { OnMyWaySheet, CantMakeItSheet, NoAccessSheet, VisitMenu, CallSheet, OfficeMsgSheet, TimeOffSheet } from '../ui/sheets';
import { me } from '../data/mock';
import { TODAY, fmtDate, addDays, mondayOf } from '../data/store';
import { useMyVisits, useAlerts, isOpenVisit, statusTone, Visit, startOf, town, plural, salespersonOf, maps, useVisitActions, itemsToCheck, commTime, img } from '../lib/visits';

export const goStart = (v: Visit) => (v.kind === 'Final survey' ? `/survey/${v.id}/measure` : `/inspection/${v.id}`);

export default function Today() {
  const nav = useNavigate();
  const toast = useToast();
  const visits = useMyVisits();
  const alerts = useAlerts();
  const { start } = useVisitActions();
  const [sheet, setSheet] = useState<{ k: string; v?: Visit } | null>(null);
  const today = visits.filter(v => v.date === TODAY && v.status !== 'No access');
  const left = today.filter(isOpenVisit);
  const next = left.find(v => v.status === 'On site') || left[0];
  const weekEnd = addDays(mondayOf(TODAY), 6);
  const later = visits.filter(v => v.date > TODAY && isOpenVisit(v)).slice(0, 6);
  const framesToday = left.filter(v => v.kind === 'Final survey').reduce((a, v) => a + v.items, 0);
  const framesWeek = visits.filter(v => v.date >= TODAY && v.date <= weekEnd && isOpenVisit(v) && v.kind === 'Final survey').reduce((a, v) => a + v.items, 0);
  const done = visits.filter(v => v.status === 'Submitted');
  const doneToday = today.filter(v => v.status === 'Submitted').length;
  const notFinished = visits.filter(v => v.status === 'On site' && v !== next);
  const moved = visits.filter(v => v.moveAsked && isOpenVisit(v));
  const fromOffice = visits.filter((v, i, a) => v.e && a.findIndex(y => y.e?.id === v.e?.id) === i).flatMap(v => (v.e?.comms || []).filter(c => c.who === 'Sarah Mitchell' && ['note', 'email-out', 'system'].includes(c.kind)).slice(0, 2).map(c => ({ v, c }))).sort((a, b) => commTime(b.c.when) - commTime(a.c.when)).slice(0, 3);
  const hello = left.length >= 3 ? 'Good morning,' : left.length ? 'Good afternoon,' : 'Well done,';
  const doStart = (v: Visit) => { if (v.status !== 'On site') { start(v); toast('Started · everything saves as you go'); } nav(goStart(v)); };
  const open = (k: string, v?: Visit) => setSheet({ k, v });

  return (
    <Screen tabs header={
      <div className="greet">
        <Link to="/profile"><Avatar i={me.initials} size={46} /></Link>
        <div className="grow"><span className="hello">{hello}</span><b>{me.name}</b></div>
        <button className="icon-btn" aria-label="Search" onClick={() => nav('/search')}><IconSearch size={21} /></button>
        <button className="icon-btn" aria-label="Notifications" onClick={() => nav('/notifications')}><IconBell size={21} />{alerts.length > 0 && <span className="badge">{alerts.length}</span>}</button>
      </div>
    }>
      <div className="pad">
        {/* Summary */}
        <div className="card" style={{ gap: 18 }}>
          <div className="between">
            <button className="pill-sel" onClick={() => nav('/calendar')}><span className="ic"><IconCalendarEvent size={16} /></span>{fmtDate(TODAY, { weekday: 'long', day: 'numeric', month: 'short' })}<IconChevronDown size={15} /></button>
            <span className="outline-pill">{left.length ? 'On duty' : 'Day done'}</span>
          </div>
          <div className="vstack" style={{ gap: 6 }}>
            <span className="label">Visits left today</span>
            <span className="hstack" style={{ gap: 10, alignItems: 'baseline' }}><span className="big">{left.length}</span><span className="muted" style={{ fontSize: 15 }}>of {today.length}</span></span>
          </div>
          <div className="between">
            <span className="vstack" style={{ gap: 2 }}><span className="label">Frames to check today</span><b style={{ fontSize: 15, fontWeight: 600 }}>{framesToday}</b></span>
            <span className="vstack" style={{ gap: 2, alignItems: 'flex-end' }}><span className="label">This week</span><b style={{ fontSize: 15, fontWeight: 600 }}>{framesWeek} frames</b></span>
          </div>
          <div className="qa">
            <button className="main" onClick={() => (next ? doStart(next) : nav('/visits'))}><span className="ic">{next?.status === 'On site' ? <IconArrowRight size={22} /> : <IconPlayerPlay size={21} />}</span>{next?.status === 'On site' ? 'Continue' : 'Start'}</button>
            <a href={today.length > 1 ? `https://www.google.com/maps/dir/${today.map(v => encodeURIComponent(v.address)).join('/')}` : maps(next?.address || '')} target="_blank" rel="noreferrer"><span className="ic"><IconRoute size={21} /></span>Route</a>
            <button onClick={() => nav('/calendar')}><span className="ic"><IconCalendarEvent size={21} /></span>Calendar</button>
            <button onClick={() => open('off')}><span className="ic"><IconBeach size={21} /></span>Time off</button>
          </div>
        </div>

        {(notFinished.length > 0 || moved.length > 0) && (
          <div className="vstack" style={{ gap: 10 }}>
            {notFinished.map(v => <Link key={v.id} to={goStart(v)} className="alert err"><IconAlertTriangle size={16} /><span className="grow"><b>Not finished · {v.customer}</b><br />Tap to carry on where you left off.</span><IconChevronRight size={18} color="#a3b0ad" style={{ alignSelf: 'center' }} /></Link>)}
            {moved.map(v => <Link key={v.id} to={v.to} className="alert warn"><IconCalendarEvent size={16} /><span className="grow"><b>Waiting for the office · {v.customer}</b><br />You asked to move {fmtDate(v.date)}.</span><IconChevronRight size={18} color="#a3b0ad" style={{ alignSelf: 'center' }} /></Link>)}
          </div>
        )}

        {/* Next visit */}
        <div className="sec"><h3>{next?.status === 'On site' ? 'You are here now' : 'Next visit'}</h3>{next && <Link to={next.to} className="more" aria-label="Open next visit"><IconArrowRight size={20} /></Link>}</div>
        {next ? (
          <div className="card" style={{ padding: 10, gap: 0 }}>
            <div className="photo" style={{ height: 156, backgroundImage: `url(${img(next.photo)})` }}>
              <div className="photo-tags"><Tag tone={next.kind === 'Final survey' ? 'jade' : 'warn'}>{next.kind}</Tag><Tag tone={statusTone[next.status]}>{next.status}</Tag></div>
            </div>
            <div className="vstack" style={{ gap: 14, padding: '16px 10px 10px' }}>
              <div className="between" style={{ alignItems: 'flex-start' }}>
                <span className="vstack" style={{ gap: 2 }}><b style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.4 }}>{next.customer}</b><span className="small muted">{town(next.address)} · {next.e?.jobId || next.id}</span></span>
                <span className="vstack" style={{ gap: 2, alignItems: 'flex-end' }}><b style={{ fontSize: 17, fontWeight: 600 }}>{startOf(next.time)}</b><span className="tiny muted">until {next.time.split('– ')[1] || ''}</span></span>
              </div>
              <div className="facts">
                <span><IconMapPin size={17} />{next.address}</span>
                {next.kind === 'Final survey' ? <span><IconRuler size={17} />{plural(next.items, 'frame')} to check · measured by {salespersonOf(next.e)}</span> : <span><IconTool size={17} />{next.snag.title}</span>}
                {next.kind === 'Final survey' && next.e?.survey?.notes && <span><IconAlertTriangle size={17} style={{ color: 'var(--warn)' }} /><span><b style={{ fontWeight: 600, color: 'var(--text)' }}>{salespersonOf(next.e).split(' ')[0]}:</b> {next.e.survey.notes}</span></span>}
              </div>
              <div className="hstack" style={{ gap: 8 }}>
                <a className="icon-btn soft" aria-label="Call" href={`tel:${(next.e?.phone || '').replace(/\s/g, '')}`} onClick={() => toast(`Calling ${next.customer}`)}><IconPhone size={20} /></a>
                <a className="icon-btn soft" aria-label="Directions" href={maps(next.address)} target="_blank" rel="noreferrer"><IconMapPin size={20} /></a>
                <button className="icon-btn soft" aria-label="More" onClick={() => open('menu', next)}><IconDots size={20} /></button>
                {next.status === 'Booked'
                  ? <button className="btn btn-outline btn-sm grow" onClick={() => open('way', next)}><IconCar size={17} />On my way</button>
                  : <button className="btn btn-outline btn-sm grow" onClick={() => open('msg', next)}><IconMessage size={17} />Office</button>}
              </div>
              <button className="btn btn-primary btn-block" onClick={() => doStart(next)}>{next.status === 'On site' ? <>Continue the {next.kind === 'Final survey' ? 'survey' : 'inspection'}<IconArrowRight size={18} /></> : <><IconPlayerPlay size={18} />Start {next.kind === 'Final survey' ? 'survey' : 'inspection'}</>}</button>
              {next.status === 'On my way' && <span className="tiny muted" style={{ textAlign: 'center', marginTop: -4 }}>Customer told you're on your way · {next.e?.finalSurvey?.onWay || next.snag?.inspOnWay}</span>}
            </div>
          </div>
        ) : (
          <div className="card" style={{ alignItems: 'center', textAlign: 'center', padding: 28 }}><span className="icircle jade" style={{ width: 56, height: 56 }}><IconCircleCheck size={28} /></span><b style={{ fontSize: 16, fontWeight: 600 }}>Nothing left for today</b><span className="small muted">{doneToday ? `You finished ${plural(doneToday, 'visit')} today.` : 'Your next visits are below.'}</span></div>
        )}

        {/* Route */}
        <div className="sec"><h3>Today's route</h3><Link to="/visits?show=today" className="more" aria-label="All today"><IconArrowRight size={20} /></Link></div>
        <div className="card flush" style={{ padding: '10px 0' }}>
          {today.length === 0 && <span className="small muted" style={{ padding: 20 }}>Nothing booked today.</span>}
          <div className="route">
            {today.map((v, i) => (
              <React.Fragment key={v.id}>
                {i > 0 && <div className="drive"><IconCar size={14} />About {20 + i * 5} min drive</div>}
                <div className="stop">
                  <div className="rail"><span className={`pin ${v.status === 'Submitted' ? 'done' : v === next ? 'now' : ''}`}>{v.status === 'Submitted' ? <IconCircleCheck size={15} /> : i + 1}</span>{i < today.length - 1 && <span className="line" />}</div>
                  <Link to={v.kind === 'Final survey' && v.status === 'Submitted' ? `/report/${v.id}` : v.to} className="hstack grow" style={{ gap: 12, padding: '8px 0' }}>
                    <Thumb src={v.photo} size={46} />
                    <span className="vstack grow" style={{ gap: 2 }}><span className="row-title ell">{v.customer}</span><span className="row-sub ell">{startOf(v.time)} · {town(v.address)} · {v.kind === 'Final survey' ? plural(v.items, 'frame') : 'Inspection'}</span></span>
                    <Tag tone={statusTone[v.status]}>{v.status}</Tag>
                  </Link>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Coming up */}
        <div className="sec"><h3>Coming up</h3><Link to="/calendar" className="more" aria-label="Calendar"><IconArrowRight size={20} /></Link></div>
        {later.length === 0 ? <span className="small muted">Nothing else booked yet.</span> : (
          <div className="chips" style={{ gap: 12, margin: '-6px -20px', padding: '6px 20px 14px' }}>
            {later.map(v => (
              <Link key={v.id} to={v.to} className="mini" style={{ width: 172, flex: '0 0 172px' }}>
                <div className="between"><span className="ic">{v.kind === 'Final survey' ? <IconRuler size={19} /> : <IconTool size={19} />}</span>{v.moveAsked && <Tag tone="warn">Moving</Tag>}</div>
                <b className="ell" style={{ fontSize: 14.5, fontWeight: 600, marginTop: 8 }}>{v.customer}</b>
                <span className="tiny muted">{fmtDate(v.date)} · {startOf(v.time)}</span>
                <span className="small" style={{ fontWeight: 500 }}>{v.kind === 'Final survey' ? plural(v.items, 'frame') : 'Inspection'} <span className="muted" style={{ fontWeight: 400 }}>· {town(v.address)}</span></span>
              </Link>
            ))}
          </div>
        )}

        {/* From the office */}
        <div className="sec"><h3>From the office</h3><Link to="/messages" className="more" aria-label="Messages"><IconArrowRight size={20} /></Link></div>
        <div className="card flush"><div className="list">
          {fromOffice.length === 0 && <span className="small muted" style={{ padding: 20 }}>Nothing new.</span>}
          {fromOffice.map(({ v, c }) => (
            <Link key={c.id} to={v.e ? `/messages/${v.e.id}` : v.to} className="li">
              <Avatar i="SM" size={42} />
              <span className="vstack grow" style={{ gap: 2 }}><span className="row-title ell">{c.title}</span><span className="row-sub">{v.customer} · {c.when}</span></span>
            </Link>
          ))}
        </div></div>

        {/* Recently submitted */}
        <div className="sec"><h3>Recently submitted</h3><Link to="/visits?show=done" className="more" aria-label="All submitted"><IconArrowRight size={20} /></Link></div>
        <div className="card flush"><div className="list">
          {done.slice(-3).reverse().map(v => (
            <Link key={v.id} to={v.kind === 'Final survey' ? `/report/${v.id}` : v.to} className="li">
              <Avatar i={v.e?.initials || v.customer.slice(0, 2).toUpperCase()} size={42} />
              <span className="vstack grow" style={{ gap: 2 }}><span className="row-title ell">{v.customer}</span><span className="row-sub">{v.kind} · {v.e?.finalSurvey?.doneOn || v.snag?.inspected?.on}</span></span>
              {v.kind === 'Final survey' ? (v.changed ? <Tag tone="warn">{v.changed} changed</Tag> : <Tag tone="ok">All match</Tag>) : <Tag tone="ok">Inspected</Tag>}
            </Link>
          ))}
          {done.length === 0 && <span className="small muted" style={{ padding: 20 }}>Nothing submitted yet.</span>}
        </div></div>
        <Link to="/visits" className="btn btn-outline btn-block">All my visits<IconArrowUpRight size={17} /></Link>
      </div>

      {sheet?.k === 'way' && sheet.v && <OnMyWaySheet v={sheet.v} onClose={() => setSheet(null)} />}
      {sheet?.k === 'menu' && sheet.v && <VisitMenu v={sheet.v} open={isOpenVisit(sheet.v)} onClose={() => setSheet(null)} onPick={k => (k === 'history' ? nav(`/history/${sheet.v!.e?.id}`) : setSheet({ k, v: sheet.v }))} />}
      {sheet?.k === 'cant' && sheet.v && <CantMakeItSheet v={sheet.v} onClose={() => setSheet(null)} />}
      {sheet?.k === 'noaccess' && sheet.v && <NoAccessSheet v={sheet.v} onClose={() => setSheet(null)} />}
      {sheet?.k === 'call' && sheet.v && <CallSheet v={sheet.v} onClose={() => setSheet(null)} />}
      {sheet?.k === 'msg' && sheet.v && <OfficeMsgSheet v={sheet.v} onClose={() => setSheet(null)} />}
      {sheet?.k === 'off' && <TimeOffSheet onClose={() => setSheet(null)} />}
    </Screen>
  );
}

export { itemsToCheck };
