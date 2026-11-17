import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { axiosClient, axiosClientWithAuth, renewSession } from "./client";
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

// O interceptor de renovação é registrado como efeito colateral de importar o
// client.ts. Este teste existe para o registro não se perder em silêncio se as
// instâncias do axios mudarem de lugar: ele exercita o interceptor de verdade,
// pelo mesmo import que o resto do front usa.
it("renews the session and retries the request after a 401", async () => {
  const session = { userId: 7, expiresIn: 30 };
  const post = jest
    .spyOn(axiosClient, "post")
    .mockResolvedValue({ data: session });

  let calls = 0;
  const adapter = jest.fn(async (config: InternalAxiosRequestConfig) => {
    calls += 1;
    if (calls === 1) {
      throw new AxiosError("unauthorized", undefined, config, undefined, {
        status: 401,
        statusText: "Unauthorized",
        data: {},
        headers: {},
        config,
      });
    }
    return {
      status: 200,
      statusText: "OK",
      data: "ok",
      headers: {},
      config,
    };
  });

  const response = await axiosClientWithAuth.get("/class", { adapter });

  expect(response.data).toBe("ok");
  expect(adapter).toHaveBeenCalledTimes(2);
  expect(post).toHaveBeenCalledWith("/auth/refresh");
});
