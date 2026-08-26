'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Code, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '@/app/integration/scheduler-api/auth-service';
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
import { toast } from '@/hooks/use-toast';

const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'As senhas não conferem')
    .required('Confirmação de senha é obrigatória'),
});

export default function ResetPassword({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: confirmReset, isPending } = useMutation({
    mutationFn: (values: { password: string; confirmPassword: string }) =>
      AuthService.confirmReset(token, values.password, values.confirmPassword),
    onSuccess: () => {
      toast({
        title: 'Senha redefinida',
        description: 'Sua senha foi alterada com sucesso.',
      });
      router.replace('/login');
    },
    onError: (err) => {
      const data = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      toast({
        title: 'Erro',
        description: data?.message || 'Token inválido ou expirado',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Code className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">
            EEVEE Code Lab
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Redefina sua senha
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova senha</CardTitle>
            <CardDescription>
              Escolha uma nova senha para sua conta
            </CardDescription>
          </CardHeader>
          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={resetPasswordSchema}
            onSubmit={(values) => confirmReset(values)}
          >
            {({ values, errors, handleChange }) => (
              <Form>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nova senha</Label>
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
                      <p className="text-sm text-destructive">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      className={
                        errors.confirmPassword ? 'border-destructive' : ''
                      }
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? 'Redefinindo...' : 'Redefinir senha'}
                  </Button>
                </CardFooter>
              </Form>
            )}
          </Formik>
        </Card>
      </div>
    </div>
  );
}
