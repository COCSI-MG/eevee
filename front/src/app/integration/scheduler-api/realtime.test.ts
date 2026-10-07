jest.mock("socket.io-client", () => ({ io: jest.fn() }));

const mockSocket = {
  disconnect: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
  io: { on: jest.fn() },
};
let channel: {
  onmessage?: (event: { data: string }) => void;
  postMessage: jest.Mock;
};

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();
  mockSocket.disconnect.mockReturnValue(mockSocket);
  mockSocket.connect.mockReturnValue(mockSocket);
  channel = { postMessage: jest.fn() };
  Object.defineProperty(globalThis, "BroadcastChannel", {
    configurable: true,
    writable: true,
    value: jest.fn(() => channel),
  });
  // resetModules creates a new mock module instance.
  ((await import("socket.io-client")).io as jest.Mock).mockReturnValue(
    mockSocket,
  );
});

afterEach(() => {
  delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
});

it("does not open an unused socket when the session renews", async () => {
  const { refreshSchedulingSocketSession } = await import("./realtime");
  refreshSchedulingSocketSession();
  expect((await import("socket.io-client")).io).not.toHaveBeenCalled();
  expect(channel.postMessage).toHaveBeenCalledWith("renewed");
});

it("reuses subscribers while creating a fresh authenticated transport", async () => {
  const { getSchedulingSocket, refreshSchedulingSocketSession } = await import(
    "./realtime"
  );
  const socket = getSchedulingSocket();
  refreshSchedulingSocketSession();
  expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  expect(getSchedulingSocket()).toBe(socket);
  expect((await import("socket.io-client")).io).toHaveBeenCalledTimes(1);
  expect((await import("socket.io-client")).io).toHaveBeenCalledWith(
    "/realtime",
    expect.objectContaining({ forceNew: true, withCredentials: true }),
  );
});

it("reconnects after another tab renews without rebroadcasting", async () => {
  const { getSchedulingSocket } = await import("./realtime");
  getSchedulingSocket();
  channel.onmessage?.({ data: "renewed" });
  expect(mockSocket.connect).toHaveBeenCalledTimes(1);
  expect(channel.postMessage).not.toHaveBeenCalled();
});

it("works when cross-tab messaging is unavailable", async () => {
  delete (globalThis as { BroadcastChannel?: unknown }).BroadcastChannel;
  const { getSchedulingSocket, refreshSchedulingSocketSession } = await import(
    "./realtime"
  );
  getSchedulingSocket();
  refreshSchedulingSocketSession();
  expect(mockSocket.connect).toHaveBeenCalledTimes(1);
});
