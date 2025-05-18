'use client';

import { useQuery } from '@tanstack/react-query';
import { ClassesService } from '../integration/scheduler-api/classes';
import { useEffect, useState } from 'react';
import { useAuthUser } from '@/hooks/use-auth-user';
import { Class } from '../interface/scheduler-api/class';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { GraduationCap, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function ClassPage() {
  const { user } = useAuthUser();
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);

  const {
    data: classes,
    isSuccess,
    isPending,
  } = useQuery({
    queryKey: ['classes'],
    refetchOnWindowFocus: true,
    initialData: [],
    queryFn: ClassesService.listClasses,
    enabled: !!user,
  });

  useEffect(() => {
    if (isSuccess && !isPending && classes.length > 0 && user) {
      const userClasses = classes.filter((classItem) => {
        console.debug({
          classItem,
          userId: user.id,
          students: classItem.users,
        })
        return classItem.users.some((student) => student.userId === user.id);
      });
      setFilteredClasses(userClasses);
    }
  }, [isSuccess, classes, user, isPending]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground mt-1">
            Here you can find all your classes.
          </p>
        </div>
      </div>

      {!isPending && isSuccess && filteredClasses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => (
            <Card
              key={cls.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{cls.name}</CardTitle>
                  <GraduationCap className="h-6 w-6" />
                </div>
                <CardDescription className="line-clamp-2">
                  {cls.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>1 assignments</span>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/assignments/${cls.id}`} className="flex-1 mt-4">
                  <Button
                    variant="default"
                    className="w-full flex items-center"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Assignments
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-xl font-bold">No classes found</h2>
          <p className="text-muted-foreground">
            You are not enrolled in any classes.
          </p>
        </div>
      )}
    </div>
  );
}
