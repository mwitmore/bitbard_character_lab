import { formatActors, formatMessages, getActorDetails, formatTimestamp, } from "../src/messages.ts";
import { describe, test, expect, vi, beforeAll } from "vitest";
describe("Messages Library", () => {
    let runtime;
    let actors;
    let userId;
    beforeAll(() => {
        // Mock runtime with necessary methods
        runtime = {
            databaseAdapter: {
                // Using vi.fn() instead of jest.fn()
                getParticipantsForRoom: vi.fn(),
                getAccountById: vi.fn(),
            },
        };
        // Mock user data with proper UUID format
        userId = "123e4567-e89b-12d3-a456-426614174000";
        actors = [
            {
                id: userId,
                name: "Test User",
                username: "testuser",
                details: {
                    tagline: "A test user",
                    summary: "This is a test user for the system.",
                    quote: "",
                },
            },
        ];
    });
    test("getActorDetails should return actors based on roomId", async () => {
        const roomId = "123e4567-e89b-12d3-a456-426614174001";
        // Using vi.mocked() type assertion instead of jest.Mock casting
        vi.mocked(runtime.databaseAdapter.getParticipantsForRoom).mockResolvedValue([userId]);
        vi.mocked(runtime.databaseAdapter.getAccountById).mockResolvedValue({
            id: userId,
            name: "Test User",
            username: "testuser",
            details: {
                tagline: "A test user",
                summary: "This is a test user for the system.",
            },
        });
        const result = await getActorDetails({ runtime, roomId });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].name).toBe("Test User");
        expect(result[0].details?.tagline).toBe("A test user");
    });
    test("formatActors should format actors into a readable string", () => {
        const formattedActors = formatActors({ actors });
        expect(formattedActors).toContain("Test User");
        expect(formattedActors).toContain("A test user");
        expect(formattedActors).toContain("This is a test user for the system.");
    });
    test("formatMessages should format messages into a readable string", () => {
        const messages = [
            {
                content: { text: "Hello, world!" },
                userId: userId,
                roomId: "123e4567-e89b-12d3-a456-426614174002",
                createdAt: new Date().getTime(),
                agentId: "", // assuming agentId is an empty string here
            },
        ];
        const formattedMessages = formatMessages({ messages, actors });
        // Assertions
        expect(formattedMessages).toContain("Hello, world!");
        expect(formattedMessages).toContain("Test User");
    });
    test("formatTimestamp should return correct time string", () => {
        const timestamp = new Date().getTime() - 60000; // 1 minute ago
        const result = formatTimestamp(timestamp);
        // Assertions
        expect(result).toBe("1 minute ago");
    });
    test("formatMessages should include attachments if present", () => {
        const messages = [
            {
                content: {
                    text: "Check this attachment",
                    attachments: [
                        {
                            id: "123e4567-e89b-12d3-a456-426614174003",
                            title: "Image",
                            url: "http://example.com/image.jpg",
                        },
                    ],
                },
                userId: userId,
                roomId: "123e4567-e89b-12d3-a456-426614174004",
                createdAt: new Date().getTime(),
                agentId: "", // assuming agentId is an empty string here
            },
        ];
        const formattedMessages = formatMessages({ messages, actors });
        // Assertions
        expect(formattedMessages).toContain("Check this attachment");
        expect(formattedMessages).toContain("Attachments: [");
    });
    test("formatMessages should handle empty attachments gracefully", () => {
        const messages = [
            {
                content: {
                    text: "No attachments here",
                },
                userId: userId,
                roomId: "123e4567-e89b-12d3-a456-426614174005",
                createdAt: new Date().getTime(),
                agentId: "", // assuming agentId is an empty string here
            },
        ];
        const formattedMessages = formatMessages({ messages, actors });
        // Assertions
        expect(formattedMessages).toContain("No attachments here");
        expect(formattedMessages).not.toContain("Attachments");
    });
});
describe("Messages", () => {
    const mockActors = [
        {
            id: "123e4567-e89b-12d3-a456-426614174006",
            name: "Alice",
            username: "alice",
            details: {
                tagline: "Software Engineer",
                summary: "Full-stack developer with 5 years experience",
                quote: "",
            },
        },
        {
            id: "123e4567-e89b-12d3-a456-426614174007",
            name: "Bob",
            username: "bob",
            details: {
                tagline: "Product Manager",
                summary: "Experienced in agile methodologies",
                quote: "",
            },
        },
    ];
    const mockMessages = [
        {
            id: "123e4567-e89b-12d3-a456-426614174008",
            roomId: "123e4567-e89b-12d3-a456-426614174009",
            userId: mockActors[0].id,
            createdAt: Date.now() - 5000, // 5 seconds ago
            content: {
                text: "Hello everyone!",
                action: "wave",
            },
            agentId: "123e4567-e89b-12d3-a456-426614174001",
        },
        {
            id: "123e4567-e89b-12d3-a456-426614174010",
            roomId: "123e4567-e89b-12d3-a456-426614174009",
            userId: mockActors[1].id,
            createdAt: Date.now() - 60000, // 1 minute ago
            content: {
                text: "Hi Alice!",
                attachments: [
                    {
                        id: "123e4567-e89b-12d3-a456-426614174011",
                        title: "Document",
                        url: "https://example.com/doc.pdf",
                    },
                ],
            },
            agentId: "123e4567-e89b-12d3-a456-426614174001",
        },
    ];
    describe("getActorDetails", () => {
        it("should retrieve actor details from database", async () => {
            const mockRuntime = {
                databaseAdapter: {
                    getParticipantsForRoom: vi
                        .fn()
                        .mockResolvedValue([
                        mockActors[0].id,
                        mockActors[1].id,
                    ]),
                    getAccountById: vi.fn().mockImplementation((id) => {
                        const actor = mockActors.find((a) => a.id === id);
                        return Promise.resolve(actor);
                    }),
                },
            };
            const actors = await getActorDetails({
                runtime: mockRuntime,
                roomId: "123e4567-e89b-12d3-a456-426614174009",
            });
            expect(actors).toHaveLength(2);
            expect(actors[0].name).toBe("Alice");
            expect(actors[1].name).toBe("Bob");
            expect(mockRuntime.databaseAdapter.getParticipantsForRoom).toHaveBeenCalled();
        });
        it("should filter out null actors", async () => {
            const invalidId = "123e4567-e89b-12d3-a456-426614174012";
            const mockRuntime = {
                databaseAdapter: {
                    getParticipantsForRoom: vi
                        .fn()
                        .mockResolvedValue([mockActors[0].id, invalidId]),
                    getAccountById: vi.fn().mockImplementation((id) => {
                        const actor = mockActors.find((a) => a.id === id);
                        return Promise.resolve(actor || null);
                    }),
                },
            };
            const actors = await getActorDetails({
                runtime: mockRuntime,
                roomId: "123e4567-e89b-12d3-a456-426614174009",
            });
            expect(actors).toHaveLength(1);
            expect(actors[0].name).toBe("Alice");
        });
    });
    describe("formatActors", () => {
        it("should format actors with complete details", () => {
            const formatted = formatActors({ actors: mockActors });
            expect(formatted).toContain("Alice: Software Engineer");
            expect(formatted).toContain("Full-stack developer with 5 years experience");
            expect(formatted).toContain("Bob: Product Manager");
            expect(formatted).toContain("Experienced in agile methodologies");
        });
        it("should handle actors without details", () => {
            const actorsWithoutDetails = [
                {
                    id: "123e4567-e89b-12d3-a456-426614174013",
                    name: "Charlie",
                    username: "charlie",
                    details: {
                        tagline: "Tag",
                        summary: "Summary",
                        quote: "Quote",
                    },
                },
            ];
            const formatted = formatActors({ actors: actorsWithoutDetails });
            expect(formatted).toBe("Charlie: Tag\nSummary");
        });
        it("should handle empty actors array", () => {
            const formatted = formatActors({ actors: [] });
            expect(formatted).toBe("");
        });
    });
    describe("formatMessages", () => {
        it("should format messages with all details", () => {
            const formatted = formatMessages({
                messages: mockMessages,
                actors: mockActors,
            });
            const lines = formatted.split("\n");
            expect(lines[1]).toContain("Alice");
            expect(lines[1]).toContain("(wave)");
            expect(lines[1]).toContain("(just now)");
        });
        it("should handle messages from unknown users", () => {
            const messagesWithUnknownUser = [
                {
                    id: "123e4567-e89b-12d3-a456-426614174014",
                    roomId: "123e4567-e89b-12d3-a456-426614174009",
                    userId: "123e4567-e89b-12d3-a456-426614174015",
                    createdAt: Date.now(),
                    content: { text: "Test message" },
                    agentId: "123e4567-e89b-12d3-a456-426614174001",
                },
            ];
            const formatted = formatMessages({
                messages: messagesWithUnknownUser,
                actors: mockActors,
            });
            expect(formatted).toContain("Unknown User: Test message");
        });
        it("should handle messages with no action", () => {
            const messagesWithoutAction = [
                {
                    id: "123e4567-e89b-12d3-a456-426614174016",
                    roomId: "123e4567-e89b-12d3-a456-426614174009",
                    userId: mockActors[0].id,
                    createdAt: Date.now(),
                    content: { text: "Simple message" },
                    agentId: "123e4567-e89b-12d3-a456-426614174001",
                },
            ];
            const formatted = formatMessages({
                messages: messagesWithoutAction,
                actors: mockActors,
            });
            expect(formatted).not.toContain("()");
            expect(formatted).toContain("Simple message");
        });
        it("should handle empty messages array", () => {
            const formatted = formatMessages({
                messages: [],
                actors: mockActors,
            });
            expect(formatted).toBe("");
        });
    });
    describe("formatTimestamp", () => {
        it("should handle exact time boundaries", () => {
            const now = Date.now();
            expect(formatTimestamp(now)).toContain("just now");
        });
    });
});
//# sourceMappingURL=messages.test.js.map