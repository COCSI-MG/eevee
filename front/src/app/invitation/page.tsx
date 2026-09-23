"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { InvitationDetails, Invitations, invitationError } from '@/app/integration/scheduler-api/invitations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
export default function AcceptInvitationPage() {
  const [token,setToken]=useState('');
  const [details,setDetails]=useState<InvitationDetails>();
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [accepted,setAccepted]=useState(false);
  useEffect(()=>{
    const value=new URLSearchParams(window.location.hash.slice(1)).get('token')||'';
    setToken(value);
    if(!/^[a-f0-9]{64}$/.test(value)){setError('Link de convite inválido. Solicite um novo link ao professor.');setLoading(false);return;}
    Invitations.inspect(value).then(setDetails).catch(e=>setError(invitationError(e))).finally(()=>setLoading(false));
  },[]);
  const accept=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');
    if(!details?.existingAccount&&password!==confirm){setError('As senhas não conferem.');return;}
    setBusy(true);
    try{await Invitations.accept(token,password);setAccepted(true);setPassword('');setConfirm('');setToken('');window.history.replaceState(null,'','/invitation');}catch(e){setError(invitationError(e));}finally{setBusy(false);}
  };
  return <main className="mx-auto my-12 max-w-xl space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
    <h1 className="text-3xl font-bold">Bem-vindo à EEVEE</h1>
    {loading&&<p>Verificando convite…</p>}
    {error&&<p role="alert">{error}</p>}
    {accepted?<><p role="status">Convite aceito! Sua conta está pronta e suas turmas foram adicionadas.</p><Link href="/login" className="inline-block rounded bg-primary px-5 py-3 text-primary-foreground">Entrar na EEVEE</Link></>:details&&<>
      <p>Olá, {details.name}. Este convite é para <strong>{details.email}</strong>.</p>
      <ul className="list-disc pl-6">{details.classes.map(c=><li key={c.id}>{c.name}</li>)}</ul>
      <p>Válido até {new Date(details.expiresAt).toLocaleString('pt-BR')}.</p>
      <form onSubmit={accept} className="space-y-4">
        <p>{details.existingAccount?'Você já tem uma conta. Confirme sua senha atual para adicionar essas turmas. Sua senha não será alterada.':'Crie sua senha pessoal para aceitar o convite. Use pelo menos 8 caracteres.'}</p>
        <label className="block space-y-2"><span>{details.existingAccount?'Senha atual':'Nova senha'}</span><Input type="password" required minLength={details.existingAccount?1:8} maxLength={72} autoComplete={details.existingAccount?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} /></label>
        {!details.existingAccount&&<label className="block space-y-2"><span>Confirmar senha</span><Input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} /></label>}
        <Button type="submit" disabled={busy} className="w-full">{busy?'Aceitando…':'Aceitar convite e entrar nas turmas'}</Button>
        {details.existingAccount&&<Link className="block underline" href="/login" target="_blank" rel="noreferrer">Esqueci minha senha — abrir a tela de entrada</Link>}
      </form>
    </>}
  </main>;
}
