import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Page from './page';
import { Invitations } from '@/app/integration/scheduler-api/invitations';
jest.mock('@/app/integration/scheduler-api/classes',()=>({ClassesService:{listOptions:jest.fn().mockResolvedValue([{id:12,name:'Banco de Dados II'}])}}));
jest.mock('@/app/integration/scheduler-api/invitations',()=>({
  ...jest.requireActual('@/app/integration/scheduler-api/invitations'),
  Invitations:{list:jest.fn().mockResolvedValue({data:[],meta:{total:0,totalPages:0}}),create:jest.fn(),resend:jest.fn(),revoke:jest.fn()},
}));
it('requires recipient review and explicit send, retaining a result per recipient',async()=>{
  (Invitations.create as jest.Mock).mockResolvedValueOnce({deliveryStatus:'sent'}).mockResolvedValueOnce({deliveryStatus:'failed'});
  const cache=new QueryClient({defaultOptions:{queries:{retry:false}}});
  render(<QueryClientProvider client={cache}><Page/></QueryClientProvider>);
  fireEvent.click(await screen.findByRole('checkbox',{name:'Banco de Dados II'}));
  fireEvent.change(screen.getByRole('textbox'),{target:{value:'Ana; ana@example.com\nBruno; bruno@example.com'}});
  fireEvent.click(screen.getByRole('button',{name:'Revisar destinatários'}));
  expect(Invitations.create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Enviar 2 convite(s) por e-mail'}));
  await waitFor(()=>expect(Invitations.create).toHaveBeenCalledTimes(2));
  expect(Invitations.create).toHaveBeenNthCalledWith(1,{name:'Ana',email:'ana@example.com',classIds:[12]});
  expect(await screen.findByText('ana@example.com: Enviado ao servidor de e-mail')).toBeInTheDocument();
  expect(await screen.findByText('bruno@example.com: Falha no envio. Use Reenviar no histórico.')).toBeInTheDocument();
});
