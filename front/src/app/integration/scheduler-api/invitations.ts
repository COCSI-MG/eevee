import { axiosClient, axiosClientWithAuth } from './client';
export interface Invitation {
  id:number; email:string; name:string; classIds:number[]; expiresAt:string;
  acceptedAt:string|null; revokedAt:string|null; deliveryStatus:string; sentAt:string|null;
}
export interface InvitationDetails {
  email:string; name:string; classes:{id:number;name:string}[]; expiresAt:string; existingAccount:boolean;
}
export const Invitations = {
  list: async(page:number):Promise<{data:Invitation[];meta:{total:number;totalPages:number}}> => (await axiosClientWithAuth.get('/invitation',{params:{page}})).data,
  create: async(body:{email:string;name:string;classIds:number[]}):Promise<{deliveryStatus:string}> => (await axiosClientWithAuth.post('/invitation',body)).data,
  resend: async(id:number):Promise<{deliveryStatus:string}> => (await axiosClientWithAuth.post(`/invitation/${id}/resend`)).data,
  revoke: async(id:number) => (await axiosClientWithAuth.post(`/invitation/${id}/revoke`)).data,
  inspect: async(token:string):Promise<InvitationDetails> => (await axiosClient.post('/invitation/inspect',{token})).data,
  accept: async(token:string,password:string) => (await axiosClient.post('/invitation/accept',{token,password})).data,
};
export function invitationError(error:unknown):string {
  const message=(error as {response?:{data?:{message?:string|string[]}}}).response?.data?.message;
  return Array.isArray(message)?message.join(' '):message||'Não foi possível concluir. Tente novamente.';
}
export function parseInvitees(text:string) {
  const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if (!lines.length || lines.length>50) throw new Error('Informe de 1 a 50 pessoas por lote.');
  const seen=new Set<string>();
  return lines.map((line,i)=>{
    const parts=line.split(';').map(s=>s.trim());
    const [name,rawEmail]=parts;
    const email=rawEmail?.toLowerCase();
    if(parts.length!==2 || !name || name.length>160 || !email || email.length>254 || !/^[^\s@;]+@[^\s@;]+\.[^\s@;]+$/.test(email)) throw new Error(`Linha ${i+1}: use Nome; email válido.`);
    if(seen.has(email)) throw new Error(`E-mail repetido na linha ${i+1}: ${email}`);
    seen.add(email);
    return {name,email};
  });
}
