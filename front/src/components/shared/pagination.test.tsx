import { fireEvent, render, screen } from "@testing-library/react";
import Pagination from "./pagination";

describe("Pagination", () => {
  it("shows item range and page indicator", () => {
    render(
      <Pagination
        page={2}
        totalPages={5}
        pageSize={10}
        total={42}
        onPageChange={() => {}}
      />,
    );

    expect(screen.getByText(/Mostrando 11-20 de 42/)).toBeInTheDocument();
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
  });

  it("disables prev on first page and next on last page", () => {
    const onPageChange = jest.fn();
    const { rerender } = render(
      <Pagination
        page={1}
        totalPages={3}
        pageSize={10}
        total={25}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByLabelText("Página anterior")).toBeDisabled();
    expect(screen.getByLabelText("Próxima página")).not.toBeDisabled();

    rerender(
      <Pagination
        page={3}
        totalPages={3}
        pageSize={10}
        total={25}
        onPageChange={onPageChange}
      />,
    );
    expect(screen.getByLabelText("Próxima página")).toBeDisabled();
  });

  it("calls onPageChange with the next/prev page", () => {
    const onPageChange = jest.fn();
    render(
      <Pagination
        page={2}
        totalPages={5}
        pageSize={10}
        total={42}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Próxima página"));
    expect(onPageChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByLabelText("Página anterior"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("shows zero range and forces totalPages to at least 1 when empty", () => {
    render(
      <Pagination
        page={1}
        totalPages={0}
        pageSize={10}
        total={0}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText(/Mostrando 0-0 de 0/)).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });
});
