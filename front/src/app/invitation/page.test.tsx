import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Page from './page';
import { Invitations } from '@/app/integration/scheduler-api/invitations';
jest.mock('@/app/integration/scheduler-api/invitations',()=>({Invitations:{inspect:jest.fn(),accept:jest.fn()},invitationError:()=> 'Convite inválido ou expirado.'}));
const token='a'.repeat(64);
const details={name:'Ana',email:'ana@example.test',classes:[{id:1,name:'Banco de Dados II'}],expiresAt:'2026-12-01T00:00:00Z',existingAccount:false};
beforeEach(()=>{jest.clearAllMocks();window.history.replaceState(null,'',`/invitation#token=${token}`);(Invitations.inspect as jest.Mock).mockResolvedValue(details);(Invitations.accept as jest.Mock).mockResolvedValue({success:true});});
it('requires matching personal passwords, accepts and clears the token after success',async()=>{
  render(<Page/>);
  fireEvent.change(await screen.findByLabelText('Nova senha'),{target:{value:'new-personal-password'}});
  fireEvent.change(screen.getByLabelText('Confirmar senha'),{target:{value:'different-password'}});
  fireEvent.click(screen.getByRole('button',{name:'Aceitar convite e entrar nas turmas'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('As senhas não conferem');
  expect(Invitations.accept).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Confirmar senha'),{target:{value:'new-personal-password'}});
  fireEvent.click(screen.getByRole('button',{name:'Aceitar convite e entrar nas turmas'}));
  expect(await screen.findByRole('status')).toHaveTextContent('Convite aceito');
  expect(Invitations.accept).toHaveBeenCalledWith(token,'new-personal-password');
  expect(window.location.hash).toBe('');
});
it('asks existing users for their current password without offering to replace it',async()=>{
  (Invitations.inspect as jest.Mock).mockResolvedValue({...details,existingAccount:true});
  render(<Page/>);
  expect(await screen.findByLabelText('Senha atual')).toBeInTheDocument();
  expect(screen.queryByLabelText('Nova senha')).toBeNull();
  expect(screen.queryByLabelText('Confirmar senha')).toBeNull();
});
it('does not show an acceptance form for expired or revoked invitations',async()=>{
  (Invitations.inspect as jest.Mock).mockRejectedValue(new Error('expired'));
  render(<Page/>);
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Convite inválido'));
  expect(screen.queryByRole('button',{name:'Aceitar convite e entrar nas turmas'})).toBeNull();
});
