// Messages: one conversation per customer I visit. Message the office (staff only) or email the customer.
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconSearch, IconPencil, IconMail, IconPhone, IconLock, IconBell, IconSettings, IconSend, IconInbox, IconPhoneCall, IconDots, IconExternalLink, IconChevronRight } from '@tabler/icons-react';
import { Screen, Header, Avatar, Tag, Seg, Empty, Sheet, useToast } from '../ui/kit';
import { CallSheet } from '../ui/sheets';
import { me } from '../data/mock';
import { useStore, fmtDate } from '../data/store';
import { useConversations, needsReply, isTalk } from '../lib/visits';

const kindIcon: Record<string, any> = { 'email-in': IconMail, 'email-out': IconMail, call: IconPhone, note: IconLock, reminder: IconBell, system: IconSettings };

export default function Messages() {
  const nav = useNavigate();
  const convos = useConversations();
  const [f, setF] = useState<'reply' | 'all'>(convos.some(r => needsReply(r.e)) ? 'reply' : 'all');
  const [q, setQ] = useState('');
  const [nw, setNw] = useState(false);
  const list = convos.filter(r => (f === 'all' || needsReply(r.e)) && (r.e.name + (r.e.jobId || '') + r.e.postcode).toLowerCase().includes(q.toLowerCase()));
  return (
    <Screen tabs header={<>
      <div className="hdr-lg"><h1>Messages</h1><button className="icon-btn" aria-label="New message" onClick={() => setNw(true)}><IconPencil size={19} /></button></div>
      <div style={{ padding: '0 16px 10px', display: 'grid', gap: 10 }}>
        <div className="input-icon"><IconSearch size={18} /><input className="input" style={{ height: 44, fontSize: 15 }} placeholder="Search customer or job" value={q} onChange={e => setQ(e.target.value)} /></div>
        <Seg value={f} onChange={setF} items={[{ id: 'reply', label: `Needs reply · ${convos.filter(r => needsReply(r.e)).length}` }, { id: 'all', label: `All · ${convos.length}` }]} />
      </div>
    </>}>
      <div className="pad" style={{ paddingTop: 4 }}>
        <div className="card flush"><div className="list">
          {list.map(({ e, v }) => {
            const last = (e.comms || []).find(isTalk)!;
            return (
              <Link key={e.id} to={`/messages/${e.id}`} className="li" style={{ alignItems: 'flex-start' }}>
                <Avatar i={e.initials} size={44} />
                <span className="vstack grow" style={{ gap: 3 }}>
                  <span className="between"><b style={{ fontSize: 14.5 }}>{e.name}</b><span className="tiny muted">{last.when.split(',')[0]}</span></span>
                  <span className="small t2 ell">{last.body || last.title}</span>
                  <span className="hstack" style={{ gap: 6 }}><span className="tiny muted">{v.kind} · {fmtDate(v.date)}</span>{needsReply(e) && <Tag tone="warn">Needs reply</Tag>}</span>
                </span>
              </Link>
            );
          })}
        </div></div>
        {list.length === 0 && <Empty icon={<IconInbox size={24} />} title={f === 'reply' ? 'No one is waiting for a reply' : 'No messages'} sub="Well done." />}
      </div>
      {nw && (
        <Sheet title="New message" sub="Choose the customer" onClose={() => setNw(false)}>
          <div className="vstack" style={{ gap: 0 }}>
            {convos.map(({ e, v }) => <button key={e.id} className="menu-item" onClick={() => nav(`/messages/${e.id}?new=1`)}><Avatar i={e.initials} size={40} /><span className="grow">{e.name}<small>{v.kind} · {fmtDate(v.date)}</small></span><IconChevronRight size={18} color="#a5b2af" /></button>)}
          </div>
        </Sheet>
      )}
    </Screen>
  );
}

export function Thread() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { updEnq } = useStore();
  const convos = useConversations();
  const row = convos.find(r => r.e.id === id);
  const [mode, setMode] = useState<'note' | 'email'>(new URLSearchParams(location.hash.split('?')[1]).get('new') ? 'email' : 'note');
  const [txt, setTxt] = useState('');
  const [sheet, setSheet] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const thread = row ? [...(row.e.comms || [])].reverse() : [];
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [thread.length]);
  if (!row) return <Screen header={<Header back="/messages" title="Messages" />}><Empty icon={<IconInbox size={24} />} title="Conversation not found" /></Screen>;
  const { e, v } = row;
  const send = () => {
    if (!txt.trim()) return;
    updEnq(e.id, {}, mode === 'note' ? { kind: 'note', title: `Message from ${me.first} (surveyor)`, body: txt, who: me.name } : { kind: 'email-out', title: `Re: ${e.product}`, body: txt, who: me.name });
    toast(mode === 'note' ? 'Sent to the office · staff only' : `Email sent to ${e.name}`); setTxt('');
  };
  return (
    <Screen scrollRef={box} header={<Header back="/messages" white title={<span className="hstack" style={{ gap: 10 }}><Avatar i={e.initials} size={36} /><span className="vstack" style={{ gap: 0, minWidth: 0 }}><b className="ell" style={{ fontSize: 15 }}>{e.name}</b><span className="tiny muted">{v.kind} · {v.status}</span></span></span>} right={<button className="icon-btn" aria-label="More" onClick={() => setSheet('menu')}><IconDots size={19} /></button>} />}
      foot={<>
        <Seg value={mode} onChange={setMode} items={[{ id: 'note', label: <><IconLock size={14} />Office</> }, { id: 'email', label: <><IconMail size={14} />Customer</> }]} />
        <div className="composer">
          <textarea value={txt} onChange={x => setTxt(x.target.value)} placeholder={mode === 'note' ? 'To Sarah in the office…' : `Email ${e.name}…`} style={{ background: mode === 'note' ? '#fffbef' : '#fff' }} aria-label="Message" />
          <button className="send" disabled={!txt.trim()} onClick={send} aria-label="Send"><IconSend size={20} /></button>
        </div>
        <span className="tiny muted" style={{ textAlign: 'center' }}>{mode === 'note' ? 'Only staff see this. Never shown to the customer.' : `To ${e.email} · the office sees it too`}</span>
      </>}>
      <div className="pad" style={{ gap: 10 }}>
        {thread.map(c => {
          const I = kindIcon[c.kind] || IconMail;
          if (c.kind === 'system' || c.kind === 'reminder') return <span key={c.id} className="sys"><I size={12} />{c.title} · {c.when}</span>;
          const cls = c.kind === 'email-in' ? 'in' : c.kind === 'note' ? 'note' : 'out';
          return (
            <div key={c.id} className={`bubble ${cls}`}>
              <div className="who" style={{ color: cls === 'note' ? '#8a6400' : cls === 'out' ? 'var(--primary-dark)' : 'var(--muted)' }}><I size={13} />{c.kind === 'call' ? 'Call' : c.kind === 'note' ? 'Staff note' : 'Email'} · {c.who}</div>
              <b style={{ fontSize: 13.5 }}>{c.title}</b>{c.body && <div style={{ marginTop: 3 }}>{c.body}</div>}
              <div className="tiny muted" style={{ marginTop: 4, textAlign: 'right' }}>{c.when}</div>
            </div>
          );
        })}
      </div>
      {sheet === 'menu' && (
        <Sheet title={e.name} sub={`${e.email} · ${e.phone}`} onClose={() => setSheet(null)}>
          <div className="vstack" style={{ gap: 0 }}>
            <button className="menu-item" onClick={() => nav(v.kind === 'Final survey' && v.status === 'Submitted' ? `/report/${v.id}` : v.to)}><span className="ic"><IconExternalLink size={20} /></span><span className="grow">Open the visit<small>{v.kind} · {fmtDate(v.date)}</small></span></button>
            <a className="menu-item" href={`tel:${e.phone.replace(/\s/g, '')}`} onClick={() => { toast(`Calling ${e.name}`); setSheet(null); }}><span className="ic"><IconPhone size={20} /></span><span className="grow">Call<small>{e.phone}</small></span></a>
            <button className="menu-item" onClick={() => setSheet('call')}><span className="ic"><IconPhoneCall size={20} /></span><span className="grow">Log a phone call<small>Saved on the customer record</small></span></button>
          </div>
        </Sheet>
      )}
      {sheet === 'call' && <CallSheet v={v} onClose={() => setSheet(null)} />}
    </Screen>
  );
}
