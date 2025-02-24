import { axiosClientWithAuth } from "./client";
import {
  Assignment,
  CreateAssignmentRequest,
} from "@/app/interface/scheduler-api/assignment";

export class AssignmentService {
  static async GetMyAssignments() {
    const response = await axiosClientWithAuth.get("/assignment/me");

    return <Assignment[]>response.data;
  }

  static async GetAssignmentsAdmin() {
    const response = await axiosClientWithAuth.get("/assignment");

    return <Assignment[]>response.data;
  }

  static async GetAssignmentById(id: number) {
    console.log("id", id);
    const response = await axiosClientWithAuth.get(`/assignment/${id}`);

    console.log("response", response);

    return <Assignment>response.data;
  }

  static async CreateAssignment(data: CreateAssignmentRequest) {
    const response = await axiosClientWithAuth.post("/assignment", data);

    return <Assignment>response.data;
  }

  static async UpdateAssignment(id: number, data: CreateAssignmentRequest) {
    const response = await axiosClientWithAuth.put(`/assignment/${id}`, data);

    return <Assignment>response.data;
  }
}
