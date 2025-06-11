import { getProviders } from "../src/providers.ts";
describe("getProviders", () => {
    let runtime;
    let roomId;
    // Mock providers for testing
    const MockProvider1 = {
        get: async (_runtime, _message, _state) => {
            return "Response from Provider 1";
        },
    };
    const MockProvider2 = {
        get: async (_runtime, _message, _state) => {
            return "Response from Provider 2";
        },
    };
    const MockProvider3 = {
        get: async (_runtime, _message, _state) => {
            return "Response from Provider 3";
        },
    };
    beforeAll(() => {
        // Initialize the runtime with mock providers
        runtime = {
            providers: [MockProvider1, MockProvider2, MockProvider3],
        };
        roomId = "00000000-0000-0000-0000-000000000000"; // Example UUID
    });
    test("getProviders should call all provider get methods and return concatenated responses", async () => {
        const message = {
            userId: "00000000-0000-0000-0000-000000000001",
            content: { text: "" },
            roomId: roomId,
            agentId: "00000000-0000-0000-0000-000000000002",
        };
        const result = await getProviders(runtime, message, {});
        // Check if the responses are concatenated correctly with newline separators
        expect(result).toBe("Response from Provider 1\nResponse from Provider 2\nResponse from Provider 3");
    });
    test("getProviders should handle an empty provider list", async () => {
        runtime.providers = [];
        const message = {
            userId: "00000000-0000-0000-0000-000000000001",
            content: { text: "" },
            roomId: roomId,
            agentId: "00000000-0000-0000-0000-000000000002",
        };
        const result = await getProviders(runtime, message, {});
        // No providers, should return an empty string
        expect(result).toBe("");
    });
    test("getProviders should handle providers returning undefined", async () => {
        const MockProviderWithUndefinedResponse = {
            get: async (_runtime, _message, _state) => {
                return undefined; // Simulate undefined return
            },
        };
        runtime.providers = [MockProviderWithUndefinedResponse];
        const message = {
            userId: "00000000-0000-0000-0000-000000000001",
            content: { text: "" },
            roomId: roomId,
            agentId: "00000000-0000-0000-0000-000000000002",
        };
        const result = await getProviders(runtime, message, {});
        // Should handle undefined return and result in empty string for that provider
        expect(result).toBe("");
    });
    test("getProviders should concatenate valid responses and ignore undefined", async () => {
        const MockProviderWithValidAndUndefinedResponse = {
            get: async (_runtime, _message, _state) => {
                return "Valid response";
            },
        };
        const MockProviderWithUndefinedResponse = {
            get: async (_runtime, _message, _state) => {
                return undefined;
            },
        };
        runtime.providers = [
            MockProviderWithValidAndUndefinedResponse,
            MockProviderWithUndefinedResponse,
        ];
        const message = {
            userId: "00000000-0000-0000-0000-000000000001",
            content: { text: "" },
            roomId: roomId,
            agentId: "00000000-0000-0000-0000-000000000002",
        };
        const result = await getProviders(runtime, message, {});
        // Only the valid response should be concatenated, ignoring undefined
        expect(result).toContain("Valid response");
    });
    test("getProviders should handle error if one provider fails", async () => {
        const MockProviderThatThrows = {
            get: async (_runtime, _message, _state) => {
                throw new Error("Provider error");
            },
        };
        const message = {
            userId: "00000000-0000-0000-0000-000000000001",
            content: { text: "" },
            roomId: roomId,
            agentId: "00000000-0000-0000-0000-000000000002",
        };
        runtime.providers = [MockProviderThatThrows, MockProvider1];
        // Expect an error from the first provider but still get the response from the second provider
        await expect(getProviders(runtime, message, {})).rejects.toThrow("Provider error");
    });
    it("should handle empty provider list", async () => {
        runtime.providers = [];
        const message = {
            userId: "00000000-0000-0000-0000-000000000001",
            content: { text: "" },
            roomId,
            agentId: "00000000-0000-0000-0000-000000000002",
        };
        const responses = await getProviders(runtime, message);
        expect(responses).toBe("");
    });
    it("should filter out null and undefined responses", async () => {
        const MockProviderWithMixedResponses = {
            get: async (_runtime, _message, _state) => {
                return null;
            },
        };
        runtime.providers = [
            MockProvider1,
            MockProviderWithMixedResponses,
            MockProvider2,
        ];
        const message = {
            userId: "00000000-0000-0000-0000-000000000001",
            content: { text: "" },
            roomId,
            agentId: "00000000-0000-0000-0000-000000000002",
        };
        const responses = await getProviders(runtime, message);
        expect(responses).toBe("Response from Provider 1\nResponse from Provider 2");
    });
    it("should handle provider throwing an error", async () => {
        const MockProviderWithError = {
            get: async (_runtime, _message, _state) => {
                throw new Error("Provider error");
            },
        };
        runtime.providers = [
            MockProvider1,
            MockProviderWithError,
            MockProvider2,
        ];
        const message = {
            userId: "00000000-0000-0000-0000-000000000001",
            content: { text: "" },
            roomId,
            agentId: "00000000-0000-0000-0000-000000000002",
        };
        await expect(getProviders(runtime, message)).rejects.toThrow("Provider error");
    });
});
//# sourceMappingURL=providers.test.js.map