import { axiosClient, renewSession } from "./client";
import { refreshSchedulingSocketSession } from "./realtime";

jest.mock("./realtime", () => ({ refreshSchedulingSocketSession: jest.fn() }));

afterEach(() => jest.restoreAllMocks());
beforeEach(() => jest.clearAllMocks());

it("reconnects once after a deduplicated renewal succeeds", async () => {
  const session = { userId: 7, expiresIn: 30 };
  let resolve!: (value: { data: typeof session }) => void;
  jest.spyOn(axiosClient, "post").mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const first = renewSession();
  const second = renewSession();
  expect(first).toBe(second);
  expect(refreshSchedulingSocketSession).not.toHaveBeenCalled();
  resolve({ data: session });
  await expect(first).resolves.toBe(session);
  expect(refreshSchedulingSocketSession).toHaveBeenCalledTimes(1);
});

it("reconnects when another tab won the refresh race", async () => {
  jest
    .spyOn(axiosClient, "post")
    .mockRejectedValue({ response: { status: 409 } });
  jest.spyOn(axiosClient, "get").mockResolvedValue({ data: { userId: 7 } });
  await renewSession();
  expect(refreshSchedulingSocketSession).toHaveBeenCalledTimes(1);
});

it.each([401, 500, 409])(
  "does not reconnect on failed renewal (%s)",
  async (status) => {
    jest.spyOn(axiosClient, "post").mockRejectedValue({ response: { status } });
    jest
      .spyOn(axiosClient, "get")
      .mockRejectedValue({ response: { status: 401 } });
    await expect(renewSession()).resolves.toBeNull();
    expect(refreshSchedulingSocketSession).not.toHaveBeenCalled();
  },
);
