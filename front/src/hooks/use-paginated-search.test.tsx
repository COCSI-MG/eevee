import { act, renderHook } from "@testing-library/react";
import { usePaginatedSearch } from "./use-paginated-search";

jest.useFakeTimers();

describe("usePaginatedSearch", () => {
  it("starts on page 1 with empty search", () => {
    const { result } = renderHook(() => usePaginatedSearch());
    expect(result.current.page).toBe(1);
    expect(result.current.search).toBe("");
    expect(result.current.debouncedSearch).toBe("");
  });

  it("debounces search updates by 300ms", () => {
    const { result } = renderHook(() => usePaginatedSearch());

    act(() => result.current.setSearch("foo"));
    expect(result.current.debouncedSearch).toBe("");

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.debouncedSearch).toBe("foo");
  });

  it("resets page to 1 when debounced search changes", () => {
    const { result } = renderHook(() => usePaginatedSearch());
    act(() => result.current.setPage(4));
    expect(result.current.page).toBe(4);

    act(() => result.current.setSearch("bar"));
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.page).toBe(1);
  });
});
