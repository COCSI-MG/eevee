"use client";

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
  },
});

axiosClientWithAuth.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

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
