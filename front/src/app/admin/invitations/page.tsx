"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClassesService } from '@/app/integration/scheduler-api/classes';
import { Invitation, Invitations, invitationError, parseInvitees } from '@/app/integration/scheduler-api/invitations';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

function status(row:Invitation) {
  if(row.acceptedAt) return 'Aceito';
  if(row.revokedAt) return 'Revogado';
  if(new Date(row.expiresAt)<=new Date()) return 'Expirado';
  return row.deliveryStatus==='sent'?'Enviado ao servidor de e-mail':row.deliveryStatus==='failed'?'Falha no envio':'Aguardando envio';
}
export default function InvitationsPage() {
  const [text,setText]=useState('');
  const [classIds,setClassIds]=useState<number[]>([]);
  const [review,setReview]=useState<{name:string;email:string}[]>([]);
  const [results,setResults]=useState<{email:string;message:string}[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [page,setPage]=useState(1);
  const classes=useQuery({queryKey:['class-options'],queryFn:ClassesService.listOptions});
  const history=useQuery({queryKey:['invitations',page],queryFn:()=>Invitations.list(page)});
  useEffect(()=>{const id=Number(new URLSearchParams(window.location.search).get('classId'));if(id>0)setClassIds([id]);},[]);
  const preview=()=>{try{if(!classIds.length)throw new Error('Selecione pelo menos uma turma.');setReview(parseInvitees(text));setResults([]);setError('');}catch(e){setError((e as Error).message);}};
  const send=async()=>{
    setBusy(true);setError('');setResults([]);
    for(const person of review){
      let message='';
      try{const result=await Invitations.create({...person,classIds});message=result.deliveryStatus==='sent'?'Enviado ao servidor de e-mail':'Falha no envio. Use Reenviar no histórico.';}catch(e){message=invitationError(e);}
      setResults(old=>[...old,{email:person.email,message}]);
    }
    setReview([]);setBusy(false);void history.refetch();
  };
  const action=async(id:number,kind:'resend'|'revoke')=>{
    setBusy(true);setError('');
    try{if(kind==='revoke')await Invitations.revoke(id);else {const result=await Invitations.resend(id);if(result.deliveryStatus!=='sent')setError('Falha no envio. Confira o serviço de e-mail e tente novamente.');}await history.refetch();}catch(e){setError(invitationError(e));}finally{setBusy(false);}
  };
  return <div className="mx-auto max-w-5xl space-y-6">
    <Link href="/admin/users">← Voltar aos usuários</Link>
    <h1 className="text-3xl font-bold">Convidar alunos</h1>
    <p>Envie um convite pessoal para cada e-mail. O aluno escolhe a própria senha e entra nas turmas ao aceitar. Contas existentes mantêm a senha atual.</p>
    <fieldset disabled={busy} className="space-y-5 rounded-xl border p-5">
      <legend className="px-2 font-semibold">Preparar convites</legend>
      <label className="block space-y-2"><span>Uma pessoa por linha: Nome; email (até 50 por lote)</span><Textarea rows={8} value={text} onChange={e=>{setText(e.target.value);setReview([]);}} placeholder={'Ana Silva; ana@example.com\nBruno Souza; bruno@example.com'} /></label>
      <div className="space-y-2"><h2 className="font-semibold">Turmas para todos os destinatários deste lote</h2>
        {classes.isPending && <p>Carregando turmas…</p>}
        {classes.isError && <p role="alert">Não foi possível carregar as turmas. <button type="button" className="underline" onClick={()=>classes.refetch()}>Tentar novamente</button></p>}
        <div className="grid gap-3 sm:grid-cols-2">{classes.data?.map(c=><label key={c.id} className="flex gap-2 items-center rounded border p-3"><input type="checkbox" checked={classIds.includes(c.id)} onChange={e=>{setClassIds(ids=>e.target.checked?[...ids,c.id]:ids.filter(id=>id!==c.id));setReview([]);}} />{c.name}</label>)}</div>
      </div>
      <Button onClick={preview} disabled={!classes.data?.length}>Revisar destinatários</Button>
    </fieldset>
    {!!review.length && <section className="space-y-4 rounded-xl border p-5"><h2 className="text-xl font-semibold">Revisão: {review.length} convite(s)</h2><p>Turmas: {classes.data?.filter(c=>classIds.includes(c.id)).map(c=>c.name).join(', ')}</p><ul className="max-h-64 overflow-auto space-y-2">{review.map(p=><li key={p.email}>{p.name} — {p.email}</li>)}</ul><p>Os links expiram em 7 dias. Não feche esta página durante o envio.</p><Button disabled={busy} onClick={send}>{busy?'Enviando…':`Enviar ${review.length} convite(s) por e-mail`}</Button></section>}
    {error && <p role="alert" className="rounded border p-4">{error}</p>}
    {!!results.length && <section aria-live="polite" className="space-y-2"><h2 className="font-semibold">Resultado do lote</h2>{results.map(r=><p key={r.email}>{r.email}: {r.message}</p>)}</section>}
    <section className="space-y-4"><h2 className="text-2xl font-semibold">Histórico de convites</h2>
      <p>Enviado significa aceito pelo servidor de e-mail; não confirma entrega na caixa de entrada. Reenviar invalida o link anterior.</p>
      {history.isPending && <p>Carregando…</p>}{history.isError && <p role="alert">Não foi possível carregar os convites. <button className="underline" onClick={()=>history.refetch()}>Tentar novamente</button></p>}
      {history.data?.data.map(row=><article key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-semibold">{row.name} — {row.email}</p><p>{status(row)} · Expira em {new Date(row.expiresAt).toLocaleString('pt-BR')}</p><p className="text-sm">{row.classIds.map(id=>classes.data?.find(c=>c.id===id)?.name||`Turma ${id}`).join(', ')}</p></div>{!row.acceptedAt&&!row.revokedAt&&<div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={()=>action(row.id,'resend')}>Reenviar</Button><Button variant="outline" disabled={busy} onClick={()=>action(row.id,'revoke')}>Revogar</Button></div>}</article>)}
      {history.data?.meta.total===0&&<p>Nenhum convite enviado.</p>}
      <div className="flex items-center gap-3"><Button variant="outline" disabled={busy||page===1} onClick={()=>setPage(p=>p-1)}>Anterior</Button><span>Página {page} · {history.data?.meta.total??0} convite(s)</span><Button variant="outline" disabled={busy||!history.data||page>=history.data.meta.totalPages} onClick={()=>setPage(p=>p+1)}>Próxima</Button></div>
    </section>
  </div>;
}
