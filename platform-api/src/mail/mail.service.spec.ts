import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';
jest.mock('nodemailer',()=>({createTransport:jest.fn()}));
describe('SMTP delivery status',()=>{
  const sendMail=jest.fn();
  beforeEach(()=>{jest.clearAllMocks();(nodemailer.createTransport as jest.Mock).mockReturnValue({sendMail});});
  it('reports success only when the SMTP server accepts the recipient',async()=>{
    sendMail.mockResolvedValue({accepted:['student@example.com'],rejected:[]});
    const service=new MailService(new ConfigService({MAIL_FROM:'EEVEE <teacher@example.com>'}));
    await expect(service.sendEmail({to:'student@example.com',subject:'Invite',text:'Hello'})).resolves.toEqual({success:true});
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({from:'EEVEE <teacher@example.com>',to:'student@example.com'}));
  });
  it.each([{accepted:[],rejected:['student@example.com']},{accepted:[],rejected:[]}])('does not claim delivery for an unaccepted recipient',async response=>{
    sendMail.mockResolvedValue(response);
    const service=new MailService(new ConfigService());
    expect((await service.sendEmail({to:'student@example.com',subject:'Invite',text:'Hello'})).success).toBe(false);
  });
});
