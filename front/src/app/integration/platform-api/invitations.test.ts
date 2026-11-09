import { parseInvitees } from './invitations';
jest.mock('./client',()=>({axiosClient:{},axiosClientWithAuth:{}}));
it('parses and normalizes a paste without inventing email addresses',()=>{
  expect(parseInvitees(' Ana Silva; ANA@example.com\n\nBruno; bruno@example.com ')).toEqual([{name:'Ana Silva',email:'ana@example.com'},{name:'Bruno',email:'bruno@example.com'}]);
});
it.each(['Ana Silva','Ana; invalid','Ana; a@example.com\nOutra Ana; A@example.com',''])('rejects malformed or duplicate recipients: %s',text=>expect(()=>parseInvitees(text)).toThrow());
it('limits a batch to 50 explicit recipients',()=>{expect(()=>parseInvitees(Array.from({length:51},(_,i)=>`Aluno ${i}; aluno${i}@example.com`).join('\n'))).toThrow('50');});
