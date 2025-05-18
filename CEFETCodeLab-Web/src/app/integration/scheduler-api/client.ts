"use client";

import { AuthContext } from "@/app/context/auth-context";
// import { Route } from "@/app/routes";
import axios from "axios";

export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const axiosClientWithAuth = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${AuthContext.getAccessToken()}`,
  },
});

// axiosClientWithAuth.interceptors.response.use(
//   (response) => {
//     // Any status code that lie within the range of 2xx cause this function to trigger
//     return response;
//   },
//   (error) => {
//     // Any status codes that falls outside the range of 2xx cause this function to trigger
//     if (error.response.status === 401) {
//       console.log("Unauthorized error");

//       // Handle unauthorized error, e.g., redirect to login page
//       AuthContext.clear();
//       window.location.href = `/${Route.Login}`;
//     }
//     // You can add more error handling logic here

//     return Promise.reject(error);
//   }
// );
