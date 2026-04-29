/* @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  createApiClient: vi.fn(() => ({ client: true })),
  getConversationMessages: vi.fn(),
  getConversations: vi.fn(),
}));

vi.mock("../../../src/services/api.service", () => ({
  createApiClient: apiMocks.createApiClient,
  getConversationMessages: apiMocks.getConversationMessages,
  getConversations: apiMocks.getConversations,
}));

import { useChat } from "../../../src/hooks/use-chat";

describe("useChat", () => {
  beforeEach(() => {
    localStorage.clear();
    apiMocks.createApiClient.mockReturnValue({ client: true });
    apiMocks.getConversationMessages.mockReset();
    apiMocks.getConversations.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores the latest conversation when no conversation id is persisted", async () => {
    apiMocks.getConversations.mockResolvedValue({
      data: {
        data: {
          conversations: [{ id: "conv_latest" }],
          messages: [
            { sender: { type: "user" }, content: "Need a wake rack" },
            { sender: { type: "agent" }, content: "Here are some options" },
          ],
        },
      },
    });

    const { result } = renderHook(() =>
      useChat(
        "store_1",
        "visitor_1",
        null,
        { welcomeMessage: "Hi there!", apiRoot: "https://api.test" },
        { socket: { current: null }, token: "jwt_token" },
      ),
    );

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(3);
    });

    expect(apiMocks.getConversationMessages).not.toHaveBeenCalled();
    expect(apiMocks.getConversations).toHaveBeenCalledWith(
      { client: true },
      { storeId: "store_1", visitorId: "visitor_1" },
      expect.objectContaining({
        headers: { Authorization: "Bearer jwt_token" },
      }),
    );
    expect(
      localStorage.getItem("zanderio_conversation_store_1_visitor_1"),
    ).toBe("conv_latest");
  });

  it("falls back to the latest conversation when the persisted id is stale", async () => {
    localStorage.setItem(
      "zanderio_conversation_store_1_visitor_1",
      "conv_stale",
    );

    apiMocks.getConversationMessages.mockRejectedValue({
      response: { status: 404 },
    });
    apiMocks.getConversations.mockResolvedValue({
      data: {
        data: {
          conversations: [{ id: "conv_recovered" }],
          messages: [
            { sender: { type: "user" }, content: "Do you have this in black?" },
            { sender: { type: "agent" }, content: "Yes, it is available." },
          ],
        },
      },
    });

    const { result } = renderHook(() =>
      useChat(
        "store_1",
        "visitor_1",
        null,
        { welcomeMessage: "Hi there!", apiRoot: "https://api.test" },
        { socket: { current: null }, token: "jwt_token" },
      ),
    );

    await waitFor(() => {
      expect(
        result.current.messages.some((message) =>
          message.text?.includes("available"),
        ),
      ).toBe(true);
    });

    expect(apiMocks.getConversationMessages).toHaveBeenCalledWith(
      { client: true },
      { conversationId: "conv_stale" },
      expect.objectContaining({
        headers: { Authorization: "Bearer jwt_token" },
      }),
    );
    expect(
      localStorage.getItem("zanderio_conversation_store_1_visitor_1"),
    ).toBe("conv_recovered");
  });

  it("retries as soon as a refreshed token arrives instead of sleeping for 1500ms", async () => {
    const socketEmit = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: vi.fn().mockResolvedValue({ done: true }),
          }),
        },
      });
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      ({ token }) =>
        useChat(
          "store_1",
          "visitor_1",
          null,
          {
            welcomeMessage: "Hi there!",
            apiRoot: "https://api.test",
            aiUrl: "https://ai.test",
          },
          {
            socket: { current: { connected: true, emit: socketEmit } },
            token,
          },
        ),
      {
        initialProps: { token: "jwt_initial" },
      },
    );

    let sendPromise;
    act(() => {
      sendPromise = result.current.sendMessage("Need a wake rack");
    });

    await waitFor(() => {
      expect(socketEmit).toHaveBeenCalledWith("widget:token:request");
    });

    act(() => {
      rerender({ token: "jwt_refreshed" });
    });

    await act(async () => {
      await sendPromise;
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer jwt_initial",
    );
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer jwt_refreshed",
    );
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 1500);
  });
});
