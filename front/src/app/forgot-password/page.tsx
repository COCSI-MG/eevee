'use client';

import { useState } from 'react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import Link from 'next/link';
import { Code, Mail } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '../integration/scheduler-api/auth-service';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Insira um e-mail válido')
    .required('E-mail é obrigatório'),
});

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);

  const { mutate: requestReset, isPending } = useMutation({
    mutationFn: (email: string) => AuthService.requestReset(email),
    onSuccess: () => setSent(true),
    onError: (err) => {
      const data = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      toast({
        title: 'Erro',
        description: data?.message || 'Erro ao enviar e-mail',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Code className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-foreground">
            EEVEE Code Lab
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Recupere o acesso à sua conta
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Esqueceu sua senha?</CardTitle>
            <CardDescription>
              Digite seu e-mail e enviaremos um link para redefinir sua senha
            </CardDescription>
          </CardHeader>

          {sent ? (
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enviamos um link de recuperação para o e-mail informado.
                  Verifique sua caixa de entrada e siga as instruções.
                </p>
              </div>
            </CardContent>
          ) : (
            <Formik
              initialValues={{ email: '' }}
              validationSchema={forgotPasswordSchema}
              onSubmit={(values) => requestReset(values.email)}
            >
              {({ values, errors, handleChange }) => (
                <Form>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        value={values.email}
                        onChange={handleChange}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending
                        ? 'Enviando...'
                        : 'Enviar link de recuperação'}
                    </Button>
                  </CardFooter>
                </Form>
              )}
            </Formik>
          )}

          <CardFooter className="justify-center">
            <Link
              href="/login"
              className="text-sm text-primary hover:text-primary/90 underline underline-offset-4"
            >
              Voltar para o login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
