import {
  fireEvent,
  render,
  screen,
  act,
  cleanup,
} from "@testing-library/react";
import { ArchitectureLab } from "./architecture-lab";
import { SqlLab } from "./sql-lab";
import { architecturePractice, sqlPractice } from "@/lib/practice/presets";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = jest.fn();
  postMessage = jest.fn();
  constructor() {
    FakeWorker.instances.push(this);
  }
  reply(data: unknown) {
    act(() => this.onmessage?.({ data }));
  }
}
describe("Student practice controls", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    Object.defineProperty(globalThis, "Worker", {
      configurable: true,
      value: FakeWorker,
    });
  });
  afterEach(() => {
    cleanup();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  it("lets students construct a byte and check the guided conversion", () => {
    render(<ArchitectureLab task={architecturePractice().tasks[0]} />);
    for (const bit of [5, 3, 2, 0])
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(`Bit ${bit},`) }),
      );
    expect(screen.getByLabelText("Valor")).toHaveValue("00101101");
    fireEvent.click(screen.getByRole("button", { name: "Verificar objetivo" }));
    expect(screen.getByRole("status")).toHaveTextContent("Objetivo alcançado");
    fireEvent.click(screen.getByRole("button", { name: "Recomeçar" }));
    expect(screen.getByLabelText("Valor")).toHaveValue("00000000");
  });
  it("runs SQL in the worker and resets by destroying the old database", () => {
    const config = sqlPractice();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    render(<SqlLab setupSql={config.setupSql} task={config.tasks[0]} />);
    const worker = FakeWorker.instances[0];
    worker.reply({ ok: true, results: [] });
    fireEvent.change(screen.getByLabelText("Editor SQL"), {
      target: { value: "SELECT 1;" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Executar SQL" }));
    expect(worker.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: "run", sql: "SELECT 1;" }),
    );
    worker.reply({
      ok: true,
      results: [{ fields: [{ name: "n" }], rows: [{ n: 1 }] }],
    });
    expect(screen.getByRole("cell")).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar banco" }));
    expect(worker.terminate).toHaveBeenCalled();
    expect(FakeWorker.instances[1].postMessage).toHaveBeenCalledWith({
      action: "init",
      sql: config.setupSql,
    });
  });
  it("terminates a stalled query and requires a clean restart", () => {
    jest.useFakeTimers();
    const config = sqlPractice();
    render(<SqlLab setupSql={config.setupSql} task={config.tasks[0]} />);
    const worker = FakeWorker.instances[0];
    worker.reply({ ok: true, results: [] });
    fireEvent.click(screen.getByRole("button", { name: "Executar SQL" }));
    act(() => jest.advanceTimersByTime(10000));
    expect(worker.terminate).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Tempo limite");
    expect(screen.getByRole("button", { name: "Executar SQL" })).toBeDisabled();
  });
});
