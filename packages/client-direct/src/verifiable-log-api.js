import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { elizaLogger } from "@elizaos/core";
// Simplified service type
const ServiceType = {
    VERIFIABLE_LOG: "verifiable-log"
};
export function createVerifiableLogApiRouter(agents) {
    const router = express.Router();
    router.use(cors());
    router.use(bodyParser.json());
    router.get("/agents", async (req, res) => {
        try {
            const agentRuntime = agents.values().next().value;
            if (!agentRuntime) {
                res.status(404).json({ error: "No agents found" });
                return;
            }
            const service = agentRuntime.getService(ServiceType.VERIFIABLE_LOG);
            if (!service) {
                res.status(404).json({ error: "Verifiable log service not found" });
                return;
            }
            const result = await service.listAgents();
            res.json(result);
        }
        catch (error) {
            elizaLogger.error("Error in /agents:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
    router.get("/agents/:agentId/logs", async (req, res) => {
        try {
            const agentRuntime = agents.values().next().value;
            if (!agentRuntime) {
                res.status(404).json({ error: "No agents found" });
                return;
            }
            const service = agentRuntime.getService(ServiceType.VERIFIABLE_LOG);
            if (!service) {
                res.status(404).json({ error: "Verifiable log service not found" });
                return;
            }
            const result = await service.getAgentLogs(req.query);
            res.json(result);
        }
        catch (error) {
            elizaLogger.error("Error in /agents/:agentId/logs:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
    router.get("/agents/:agentId/logs/signature", async (req, res) => {
        try {
            const agentRuntime = agents.values().next().value;
            if (!agentRuntime) {
                res.status(404).json({ error: "No agents found" });
                return;
            }
            const service = agentRuntime.getService(ServiceType.VERIFIABLE_LOG);
            if (!service) {
                res.status(404).json({ error: "Verifiable log service not found" });
                return;
            }
            const result = await service.getAgentLogsBySignature(req.query);
            res.json(result);
        }
        catch (error) {
            elizaLogger.error("Error in /agents/:agentId/logs/signature:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });
    return router;
}
//# sourceMappingURL=verifiable-log-api.js.map