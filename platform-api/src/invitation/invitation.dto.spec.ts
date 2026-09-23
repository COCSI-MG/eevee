import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AcceptInvitationDto, CreateInvitationDto, InvitationTokenDto } from './invitation.dto';
describe('Invitation input',()=>{
  it('normalizes explicit emails and names',()=>{
    const dto=plainToInstance(CreateInvitationDto,{email:' ANA@example.com ',name:' Ana ',classIds:[1,2]});
    expect(validateSync(dto)).toEqual([]);expect(dto.email).toBe('ana@example.com');expect(dto.name).toBe('Ana');
  });
  it.each([[],[1,1],[-1],['1'],Array.from({length:31},(_,i)=>i+1)].map(classIds=>({classIds})))('rejects invalid class lists $classIds',({classIds})=>expect(validateSync(plainToInstance(CreateInvitationDto,{email:'a@example.com',name:'Ana',classIds})).length).toBeGreaterThan(0));
  it.each(['','abc','a'.repeat(65),'<script>'])('rejects invalid tokens %s',token=>expect(validateSync(plainToInstance(InvitationTokenDto,{token})).length).toBeGreaterThan(0));
  it('bounds password size before hashing',()=>expect(validateSync(plainToInstance(AcceptInvitationDto,{token:'a'.repeat(64),password:'p'.repeat(73)})).length).toBeGreaterThan(0));
});
