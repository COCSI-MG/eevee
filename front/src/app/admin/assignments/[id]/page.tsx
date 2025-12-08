"use client";

import React from "react";
import { UpdateAssignmentPageProps } from "../interface";
import { AssignmentForm } from "../assignment-form";

export default function UpdateAssignmentPage({
  params,
}: UpdateAssignmentPageProps) {
  const { id } = React.use(params);

  return <AssignmentForm existingAssignmentId={Number(id)} />;
}
