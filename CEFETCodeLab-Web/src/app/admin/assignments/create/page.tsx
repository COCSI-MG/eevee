import { Button } from '@/components/ui/button';
import { AssignmentForm } from '../assignment-form';
import Link from 'next/link';
import { Route } from '@/app/routes';
import { ArrowLeft } from 'lucide-react';

export default function CreateAssignmentPage() {
  return (
    <div className='min-h-screen text-white'>
      <div>
        <div className='flex items-center justify-between p-4'>
          <div className='flex items-center gap-2'>
            <Button variant={"ghost"} size={"sm"} className='text-slate-400 hover:text-white' asChild>
              <Link href={`${Route.AdminAssignments}`} >
                <ArrowLeft className='w-4 h-4 mr-2' />
                Voltar
              </Link>
            </Button>
            <div className='h-4 w-px bg-slate-600 mr-4' />
            <h1 className='text-xl font-semibold'>Criar Assigment</h1>
          </div>
        </div>
      </div>

      {/* <div className='border-b border-slate-700 bg-slate-800/50'> */}
      {/*   <div className='max-w-6xl mx-auto px-6 py-4'> */}
      {/*     <div className='flex items-center justify-between'> */}
      {/**/}
      {/*     </div> */}
      {/*   </div> */}
      {/* </div> */}


      <AssignmentForm />
    </div >
  );
}
