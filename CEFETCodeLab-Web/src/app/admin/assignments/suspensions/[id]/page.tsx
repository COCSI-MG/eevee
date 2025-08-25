"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AssignmentUserSuspensionService } from "@/app/integration/scheduler-api/assignment-user-suspension";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, UserX, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Page() {
  const { id } = useParams();
  const assignmentId = parseInt(id as string);
  const { toast } = useToast();

  const {
    data: suspensions,
    isLoading: suspensionsLoading,
    error: suspensionsError,
    refetch: refetchSuspensions,
  } = useQuery({
    queryKey: ["assignment-suspensions", assignmentId],
    queryFn: () => AssignmentUserSuspensionService.getSuspensionsByAssignmentId(assignmentId),
    enabled: !!assignmentId,
  });

  const removeSuspensionMutation = useMutation({
    mutationFn: ({ userId, assignmentId }: { userId: number; assignmentId: number }) =>
      AssignmentUserSuspensionService.removeSuspensionFromAssignment(userId, assignmentId),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Suspension removed successfully",
      });
      refetchSuspensions();
    },
    onError: (error: unknown) => {
      console.error("Failed to remove suspension:", error);
      toast({
        title: "Error",
        description: "Failed to remove suspension. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveSuspension = (userId: number) => {
    removeSuspensionMutation.mutate({ userId, assignmentId });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (suspensionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading suspensions...</p>
        </div>
      </div>
    );
  }

  if (suspensionsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Failed to load suspensions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Assignment Suspensions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage user suspensions for assignment ID: {assignmentId}
          </p>
        </CardHeader>
        <CardContent>
          {!suspensions || suspensions.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No suspensions</h3>
              <p className="text-sm text-gray-500">
                There are currently no suspended users for this assignment.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Suspended At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suspensions.map((suspension) => (
                  <TableRow key={suspension.id}>
                    <TableCell className="font-medium">
                      {suspension.user?.name || `User ${suspension.userId}`}
                    </TableCell>
                    <TableCell>{suspension.user?.email || "Unknown"}</TableCell>
                    <TableCell>
                      {suspension.reason ? (
                        <span className="text-sm">{suspension.reason}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No reason provided</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(suspension.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveSuspension(suspension.userId)}
                        disabled={removeSuspensionMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
