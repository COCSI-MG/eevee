"use client";

import { UsersService } from "@/app/integration/platform-api/user";
import {
  ADMIN_LIST_PAGE_SIZE,
  PaginatedResponse,
} from "@/app/interface/platform-api/pagination";
import { UserListItem } from "@/app/interface/platform-api/user";
import { useQuery } from "@tanstack/react-query";

interface UsePaginatedUsersParams {
  page: number;
  search?: string;
  pageSize?: number;
}

export const usePaginatedUsers = ({
  page,
  search,
  pageSize = ADMIN_LIST_PAGE_SIZE,
}: UsePaginatedUsersParams) => {
  return useQuery<PaginatedResponse<UserListItem>>({
    queryKey: ["paginatedUsers", page, search, pageSize],
    queryFn: () =>
      UsersService.getPaginatedUsers({
        page,
        pageSize,
        search: search?.trim() || undefined,
      }),
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
};
