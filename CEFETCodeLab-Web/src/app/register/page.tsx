'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/auth-context';
import { Route } from '../routes';
import { RegisterService } from '../integration/scheduler-api/register-service';
import { RegisterRequest } from '../interface/scheduler-api/auth';
import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';

const registerSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .required('Name is required'),
});

export default function Register() {
  const [registerData, setRegisterData] = useState<RegisterRequest>({
    email: '',
    name: '',
    password: '',
  });

  const { push } = useRouter();

  const {
    mutate: register,
    isSuccess,
    isError,
    error,
    data,
  } = useMutation({
    mutationFn: () => RegisterService.register(registerData),
  });

  useEffect(() => {
    if (isError) {
      console.error('Error register in:', error);
    }

    if (data && isSuccess) {
      AuthContext.setAccessToken(data.token);
      AuthContext.setIsAdmin(data.isAdmin);

      if (data.isAdmin) {
        push(Route.Admin);
        return;
      }
      push(Route.Assignment);
    }
  }, [isError, error, data, isSuccess, push]);

  return (
    <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
      <div>
        <h1 className="text-4xl font-bold text-center">Welcome to Code Lab</h1>
        <p className="text-center text-[#666] dark:text-[#999]">
          Create your account and start coding with us!
        </p>
      </div>

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
          setRegisterData(values);
          register();
          setSubmitting(false);
        }}
        validationSchema={registerSchema}
      >
        <Form className="flex flex-col gap-8 w-full">
          <div className="flex flex-col gap-4 w-full">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Field
              name="name"
              type="text"
              placeholder="Enter your name"
              className="input rounded-lg pl-2 h-8 text-black"
            />
            <ErrorMessage name="name" />
          </div>
          <div className="flex flex-col gap-4 w-full">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Field
              name="email"
              type="email"
              placeholder="Enter your email"
              className="input rounded-lg pl-2 h-8 text-black"
            />
            <ErrorMessage name="email" />
          </div>
          <div className="flex flex-col gap-4 w-full">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Field
              name="password"
              type="password"
              placeholder="Enter your password"
              className="input rounded-lg pl-2 h-8 text-black"
            />
            <ErrorMessage name="password" />
          </div>
          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <input
              type="submit"
              className="rounded-full cursor-pointer border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
              value="Register"
            />
          </div>
        </Form>
      </Formik>
    </main>
  );
}
