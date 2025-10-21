'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UsersService } from '@/app/integration/scheduler-api/user';
import { UpsertUser } from '@/app/interface/scheduler-api/user';

export default function UserEditPage() {
  const router = useRouter();
  const { id } = useParams<{
    id: string;
  }>();
  const isNewUser = id === 'new';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isAdmin: false,
  });

  const { data, isPending } = useQuery({
    queryKey: ['adminUsers', id],
    enabled: !isNewUser,
    queryFn: ({ queryKey }) => UsersService.getUserById(Number(queryKey[1])),
  });

  const {
    mutateAsync: upsertUser,
    isSuccess,
    data: upsertUserData,
  } = useMutation({
    mutationKey: ['adminUsers', id],
    mutationFn: (user: UpsertUser) => {
      if (isNewUser) {
        return UsersService.upsertUser(user);
      }
      return UsersService.upsertUser({ ...user, id: Number(id) });
    },
  });

  useEffect(() => {
    if (!isNewUser && data) {
      setFormData({
        ...data,
        password: data.passwordHash,
      });
    }
  }, [data, isNewUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isAdmin: checked }));
  };

  useEffect(() => {
    if (isSuccess && upsertUserData) {
      toast({
        title: isNewUser ? 'User created' : 'User updated',
        description: `Successfully ${isNewUser ? 'created' : 'updated'} user ${
          upsertUserData.name
        }`,
      });
      router.push('/admin/users');
    }
  }, [isSuccess, upsertUserData, isNewUser, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: UpsertUser = {
      ...formData,
      id: isNewUser ? 0 : Number(id),
      passwordHash: formData.password,
    };
    upsertUser(userData);
  };

  if (!isNewUser && isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNewUser ? 'Create User' : 'Edit User'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>
              {isNewUser ? 'New User Information' : 'User Information'}
            </CardTitle>
            <CardDescription>
              {isNewUser
                ? 'Add a new user to the system'
                : "Update the user's information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter user name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password ?? ''}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={formData.isAdmin}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="isAdmin">Administrator</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {isNewUser ? 'Create User' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
