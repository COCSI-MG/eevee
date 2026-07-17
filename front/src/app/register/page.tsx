'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { RegisterService } from '../integration/scheduler-api/register-service';
import { RegisterRequest } from '../interface/scheduler-api/auth';
import { ErrorMessage, Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import AuthContainer from '@/components/auth/container';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { EyeOff, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { useAuthContext } from '@/hooks/use-auth-context';

const registerSchema = Yup.object().shape({
  email: Yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  password: Yup.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .required('Senha é obrigatória'),
  name: Yup.string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(50, 'O nome deve ter no máximo 50 caracteres')
    .required('Nome é obrigatório'),
});

export default function Register() {
  const { replace } = useRouter();
  const { setSession } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: register, isPending } = useMutation({
    mutationFn: (values: RegisterRequest) => RegisterService.register(values),
    onSuccess: (session) => {
      setSession(session);
      replace(session.isAdmin ? '/admin' : '/classes');
    },
    onError: () => {
      toast({
        title: 'Erro no registro',
        description: 'Não foi possível criar sua conta. Por favor, tente novamente.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <AuthContainer context="register">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar</CardTitle>
          </CardHeader>
          <Formik
            initialValues={{
              email: '',
              password: '',
              name: '',
            }}
            onSubmit={(
              values: RegisterRequest,
              { setSubmitting }: FormikHelpers<RegisterRequest>
            ) => {
              register(values);
              setSubmitting(false);
            }}
            validationSchema={registerSchema}
          >
            {({ values, errors, handleChange }) => (
              <Form>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      type="text"
                      name="name"
                      placeholder="Seu nome"
                      onChange={handleChange}
                      value={values.name}
                      disabled={isPending}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="seu-email@exemplo.com"
                      onChange={handleChange}
                      value={values.email}
                      disabled={isPending}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passowrd">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={values.password}
                        onChange={handleChange}
                        className={
                          errors.password ? 'border-destructive pr-10' : 'pr-10'
                        }
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm">
                        {errors.password}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex-1">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isPending}
                    >
                      {isPending ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                  </div>
                  <div className="flex-1 flex justify-end">
                    <Link
                      href="/login"
                      className="text-sm text-blue-500 hover:text-blue-700 ml-4"
                    >
                      Já tem uma conta?
                    </Link>
                  </div>
                </CardFooter>
              </Form>
            )}
          </Formik>
        </Card>
      </AuthContainer>
    </div>
  );
}
