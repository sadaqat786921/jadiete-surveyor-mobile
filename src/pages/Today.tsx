// Today: where to go, in what order, and what to check when you get there.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconBell, IconSearch, IconClock, IconMapPin, IconRuler, IconTool, IconPhone, IconCar, IconDots, IconPlayerPlay, IconArrowRight,
  IconAlertTriangle, IconCircleCheck, IconChevronRight, IconCalendarEvent, IconBeach, IconMessage, IconRoute, IconFileText,
} from '@tabler/icons-react';
import { Screen, Tag, Avatar, Thumb, useToast } from '../ui/kit';
import { OnMyWaySheet, CantMakeItSheet, NoAccessSheet, VisitMenu, CallSheet, OfficeMsgSheet, TimeOffSheet } from '../ui/sheets';
import { me, IMG } from '../data/mock';
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
  const framesWeek = visits.filter(v => v.date >= TODAY && v.date <= weekEnd && isOpenVisit(v) && v.kind === 'Final survey').reduce((a, v) => a + v.items, 0);
  const done = visits.filter(v => v.status === 'Submitted');
  const doneMonth = done.filter(v => (v.e?.finalSurvey?.doneOn || v.snag?.inspected?.on || '').endsWith('Oct'));
  const notFinished = visits.filter(v => v.status === 'On site' && v !== next);
  const moved = visits.filter(v => v.moveAsked && isOpenVisit(v));
  const fromOffice = visits.filter((v, i, a) => v.e && a.findIndex(y => y.e?.id === v.e?.id) === i).flatMap(v => (v.e?.comms || []).filter(c => c.who === 'Sarah Mitchell' && ['note', 'email-out', 'system'].includes(c.kind)).slice(0, 2).map(c => ({ v, c }))).sort((a, b) => commTime(b.c.when) - commTime(a.c.when)).slice(0, 3);
  // The demo day is Friday 16 October, starting in the morning.
  const hello = left.length >= 3 ? 'Good morning' : left.length ? 'Good afternoon' : 'Well done';
  const doStart = (v: Visit) => { if (v.status !== 'On site') { start(v); toast('Started · everything saves as you go'); } nav(goStart(v)); };
  const open = (k: string, v?: Visit) => setSheet({ k, v });

  return (
    <Screen dark tabs>
      <div className="hero" style={{ paddingBottom: 70 }}>
        <div className="photo" style={{ backgroundImage: `url(${IMG.house})` }} />
        <span className="glow" />
        <div className="between" style={{ paddingTop: 6 }}>
          <Link to="/profile" className="hstack" style={{ gap: 10 }}><Avatar i={me.initials} size={42} bg="#00c7a1" fg="#0b1f1b" /><span className="vstack" style={{ gap: 0 }}><span style={{ fontSize: 12, color: '#cfe0db' }}>{fmtDate(TODAY, { weekday: 'long', day: 'numeric', month: 'long' })}</span><b style={{ fontSize: 14 }}>{me.name}</b></span></Link>
          <span className="hstack">
            <button className="icon-btn glass" aria-label="Search" onClick={() => nav('/search')}><IconSearch size={20} /></button>
            <button className="icon-btn glass" aria-label="Notifications" onClick={() => nav('/notifications')}><IconBell size={20} />{alerts.length > 0 && <span className="badge">{alerts.length}</span>}</button>
          </span>
        </div>
        <h1 style={{ fontSize: 26, letterSpacing: -0.6, marginTop: 22, lineHeight: 1.2 }}>{hello}, {me.first}</h1>
        <span style={{ color: '#cfe0db', fontSize: 13.5, display: 'block', marginTop: 6 }}>{left.length ? `${plural(left.length, 'visit')} left today${next ? ` · next is ${next.customer} at ${startOf(next.time)}` : ''}.` : 'All your visits for today are done. Well done.'}</span>
        <div className="hstack" style={{ gap: 8, marginTop: 18 }}>
          <button className="stat" onClick={() => nav('/visits?show=today')}><b>{left.length}</b><span>Visits left today</span></button>
          <button className="stat" onClick={() => nav('/calendar')}><b>{framesWeek}</b><span>Frames this week</span></button>
          <button className="stat" onClick={() => nav('/visits?show=done')}><b>{doneMonth.length}</b><span>Done this month</span></button>
        </div>
      </div>

      <div className="pad" style={{ marginTop: -54, position: 'relative' }}>
        {next ? (
          <div className="next">
            <div className="pic" style={{ backgroundImage: `url(${img(next.photo)})` }}>
              <div className="between" style={{ padding: 12 }}><Tag tone="glass">{next.status === 'On site' ? 'You are here now' : 'Next visit'}</Tag><Tag tone={next.kind === 'Final survey' ? 'jade' : 'warn'}>{next.kind}</Tag></div>
              <div style={{ position: 'absolute', left: 16, bottom: 12, right: 16, color: '#fff' }} className="between"><b style={{ fontSize: 20, letterSpacing: -0.3 }}>{next.customer}</b><span className="hstack" style={{ gap: 5, fontSize: 13, fontWeight: 600 }}><IconClock size={15} />{next.time}</span></div>
            </div>
            <div className="body">
              <div className="facts">
                <span><IconMapPin size={16} />{next.address}</span>
                {next.kind === 'Final survey' ? <span><IconRuler size={16} />{plural(next.items, 'frame')} to check · measured by {salespersonOf(next.e)}</span> : <span><IconTool size={16} />{next.snag.title}</span>}
                {next.e?.survey?.access && <span><IconRoute size={16} />Access: {next.e.survey.access} · Parking: {next.e.survey.parking}</span>}
              </div>
              {next.kind === 'Final survey' && next.e?.survey?.notes && <div className="alert warn" style={{ padding: '10px 12px' }}><IconAlertTriangle size={16} /><span><b>From {salespersonOf(next.e).split(' ')[0]}:</b> {next.e.survey.notes}</span></div>}
              {next.moveAsked && <div className="alert warn" style={{ padding: '10px 12px' }}><IconCalendarEvent size={16} /><span>You asked the office to move this visit.</span></div>}
              <div className="qa">
                <a href={maps(next.address)} target="_blank" rel="noreferrer"><span className="ic"><IconMapPin size={18} /></span>Directions</a>
                <a href={`tel:${(next.e?.phone || '').replace(/\s/g, '')}`} onClick={() => toast(`Calling ${next.customer}`)}><span className="ic"><IconPhone size={18} /></span>Call</a>
                {next.status === 'Booked' ? <button onClick={() => open('way', next)}><span className="ic"><IconCar size={18} /></span>On my way</button> : <button onClick={() => open('msg', next)}><span className="ic"><IconMessage size={18} /></span>Office</button>}
                <button onClick={() => open('menu', next)}><span className="ic"><IconDots size={18} /></span>More</button>
              </div>
              <div className="hstack" style={{ gap: 8 }}>
                <Link to={next.to} className="btn btn-outline" style={{ flex: '0 0 auto' }}>Details</Link>
                <button className="btn btn-primary grow" onClick={() => doStart(next)}>{next.status === 'On site' ? <><IconArrowRight size={18} />Continue</> : <><IconPlayerPlay size={18} />Start {next.kind === 'Final survey' ? 'survey' : 'inspection'}</>}</button>
              </div>
              {next.status === 'On my way' && <span className="tiny muted" style={{ textAlign: 'center' }}>Customer told you are on your way · {next.e?.finalSurvey?.onWay || next.snag?.inspOnWay}</span>}
            </div>
          </div>
        ) : (
          <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}><span className="tile" style={{ width: 56, height: 56, borderRadius: '50%', background: '#e3f6ec', color: 'var(--ok)' }}><IconCircleCheck size={30} /></span><b style={{ fontSize: 16 }}>Nothing left for today</b><span className="small muted">Your next visits are below.</span></div>
        )}

        {(notFinished.length > 0 || moved.length > 0) && (
          <div className="vstack" style={{ gap: 8 }}>
            {notFinished.map(v => <Link key={v.id} to={goStart(v)} className="alert err"><IconAlertTriangle size={17} /><span className="grow"><b>Not finished:</b> {v.customer}. Tap to carry on.</span><IconChevronRight size={16} /></Link>)}
            {moved.map(v => <Link key={v.id} to={v.to} className="alert warn"><IconCalendarEvent size={17} /><span className="grow"><b>Waiting for the office:</b> {v.customer} · {fmtDate(v.date)}</span><IconChevronRight size={16} /></Link>)}
          </div>
        )}

        <div className="sec"><h3>Today's route</h3>{today.length > 1 && <a href={`https://www.google.com/maps/dir/${today.map(v => encodeURIComponent(v.address)).join('/')}`} target="_blank" rel="noreferrer"><IconRoute size={15} />&nbsp;Maps</a>}</div>
        <div className="card">
          {today.length === 0 && <span className="small muted">Nothing booked today.</span>}
          <div className="route">
            {today.map((v, i) => (
              <React.Fragment key={v.id}>
                {i > 0 && <div className="drive"><IconCar size={14} />About {20 + i * 5} minutes' drive</div>}
                <div className="stop">
                  <div className="rail"><span className={`pin ${v.status === 'Submitted' ? 'done' : v === next ? 'now' : ''}`}>{v.status === 'Submitted' ? <IconCircleCheck size={16} /> : i + 1}</span>{i < today.length - 1 && <span className="line" />}</div>
                  <Link to={v.to} className="hstack grow" style={{ gap: 10, alignItems: 'flex-start', paddingBottom: 4 }}>
                    <Thumb src={v.photo} size={46} r={10} />
                    <span className="vstack grow" style={{ gap: 3 }}>
                      <span className="between"><b style={{ fontSize: 14 }}>{startOf(v.time)} · {v.customer}</b></span>
                      <span className="tiny muted ell">{v.kind === 'Final survey' ? plural(v.items, 'frame') : v.snag.title} · {town(v.address)}</span>
                      <span><Tag tone={statusTone[v.status]}>{v.status}</Tag></span>
                    </span>
                    <IconChevronRight size={18} color="#a5b2af" style={{ marginTop: 12 }} />
                  </Link>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="sec"><h3>Coming up</h3><Link to="/calendar">Calendar<IconChevronRight size={15} /></Link></div>
        {later.length === 0 ? <span className="small muted">Nothing else booked yet.</span> : (
          <div className="chips" style={{ gap: 10, margin: '0 -16px', padding: '2px 16px 6px' }}>
            {later.map(v => (
              <Link key={v.id} to={v.to} className="card tight" style={{ width: 210, flex: '0 0 210px', gap: 8, borderLeft: `4px solid ${v.kind === 'Final survey' ? '#0b6e5c' : '#e0a100'}` }}>
                <span className="hstack" style={{ gap: 10 }}><Thumb src={v.photo} size={38} r={10} /><span className="vstack grow" style={{ gap: 1 }}><b className="ell" style={{ fontSize: 13.5 }}>{v.customer}</b><span className="tiny muted">{fmtDate(v.date)}</span></span></span>
                <span className="between tiny t2"><span className="hstack" style={{ gap: 4 }}><IconClock size={13} />{v.time}</span>{v.moveAsked ? <Tag tone="warn">Move asked</Tag> : <span>{v.kind === 'Final survey' ? plural(v.items, 'frame') : 'Inspection'}</span>}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="sec"><h3>From the office</h3><Link to="/messages">Messages<IconChevronRight size={15} /></Link></div>
        <div className="card flush">
          {fromOffice.length === 0 && <span className="small muted" style={{ padding: 16 }}>Nothing new.</span>}
          <div className="list">
            {fromOffice.map(({ v, c }) => (
              <Link key={c.id} to={v.e ? `/messages/${v.e.id}` : v.to} className="li" style={{ alignItems: 'flex-start' }}>
                <Avatar i="SM" size={36} />
                <span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 13.5 }}>{c.title}</b><span className="tiny muted">{v.customer} · {c.when}</span></span>
              </Link>
            ))}
          </div>
        </div>

        <div className="sec"><h3>Recently submitted</h3><Link to="/visits?show=done">All<IconChevronRight size={15} /></Link></div>
        <div className="card flush"><div className="list">
          {done.slice(-3).reverse().map(v => (
            <Link key={v.id} to={v.kind === 'Final survey' ? `/report/${v.id}` : v.to} className="li">
              <Thumb src={v.photo} size={40} r={10} />
              <span className="vstack grow" style={{ gap: 2 }}><b style={{ fontSize: 13.5 }}>{v.customer}</b><span className="tiny muted">{v.kind} · {v.e?.finalSurvey?.doneOn || v.snag?.inspected?.on}</span></span>
              {v.kind === 'Final survey' ? (v.changed ? <Tag tone="warn">{v.changed} changed</Tag> : <Tag tone="ok">All match</Tag>) : <Tag tone="ok">Inspected</Tag>}
            </Link>
          ))}
          {done.length === 0 && <span className="small muted" style={{ padding: 16 }}>Nothing submitted yet.</span>}
        </div></div>

        <div className="grid-2" style={{ marginBottom: 8 }}>
          <button className="card tight" style={{ alignItems: 'flex-start', textAlign: 'left' }} onClick={() => open('off')}><span className="tile" style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--tint)', color: 'var(--primary-dark)' }}><IconBeach size={20} /></span><b style={{ fontSize: 13.5 }}>Add time off</b><span className="tiny muted">The office won't book you</span></button>
          <button className="card tight" style={{ alignItems: 'flex-start', textAlign: 'left' }} onClick={() => nav('/visits')}><span className="tile" style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--tint)', color: 'var(--primary-dark)' }}><IconFileText size={20} /></span><b style={{ fontSize: 13.5 }}>All my visits</b><span className="tiny muted">Surveys and inspections</span></button>
        </div>
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

// re-exported so other screens can show the frames on a visit
export { itemsToCheck };
