"use client";

import type {
  ChatOptions,
  LLMModel,
  LLMModelProvider,
  LLMUsage,
  SpeechOptions,
} from "../api";
import { useAccessStore } from "@/app/store";
import { ChatGPTApi } from "./openai";
import { ClaudeApi } from "./anthropic";
import { fetch } from "@/app/utils/stream";

export class UnifiedApi {
  private getApiClient(): ChatGPTApi | ClaudeApi {
    const accessStore = useAccessStore.getState();
    const format = accessStore.unifiedApiFormat;

    // Return appropriate API client based on format
    switch (format) {
      case "anthropic":
        return new ClaudeApi();
      case "azure":
      case "openai":
      default:
        return new ChatGPTApi();
    }
  }

  private getBaseUrl(): string {
    const accessStore = useAccessStore.getState();
    let baseUrl = accessStore.unifiedBaseUrl;

    if (!baseUrl) {
      throw new Error("Unified API base URL is not configured");
    }

    // Clean up the base URL
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    if (!baseUrl.startsWith("http")) {
      baseUrl = "https://" + baseUrl;
    }

    return baseUrl;
  }

  extractMessage(res: any) {
    // Delegate to appropriate API client
    const client = this.getApiClient();
    if ("extractMessage" in client) {
      return (client as any).extractMessage(res);
    }
    return "";
  }

  async chat(options: ChatOptions) {
    const accessStore = useAccessStore.getState();

    if (!accessStore.useUnifiedAPI) {
      throw new Error("Unified API is not enabled");
    }

    const baseUrl = this.getBaseUrl();
    const apiClient = this.getApiClient();

    // Override the URL in the underlying API client
    const originalChat = apiClient.chat.bind(apiClient);

    // Monkey patch the path method temporarily
    const originalPath = (apiClient as any).path;
    (apiClient as any).path = (path: string) => {
      // For OpenAI format, use the standard path
      if (accessStore.unifiedApiFormat === "openai") {
        return baseUrl + "/v1/chat/completions";
      } else if (accessStore.unifiedApiFormat === "anthropic") {
        return baseUrl + "/v1/messages";
      } else if (accessStore.unifiedApiFormat === "azure") {
        return (
          baseUrl +
          "/openai/deployments/" +
          options.config.model +
          "/chat/completions?api-version=2023-08-01-preview"
        );
      }
      return baseUrl + path;
    };

    try {
      // Call the underlying API client's chat method
      await originalChat(options);
    } finally {
      // Restore original path method
      (apiClient as any).path = originalPath;
    }
  }

  async speech(options: SpeechOptions): Promise<ArrayBuffer> {
    const apiClient = this.getApiClient();
    return apiClient.speech(options);
  }

  async usage(): Promise<LLMUsage> {
    const accessStore = useAccessStore.getState();
    const baseUrl = this.getBaseUrl();

    // For unified API, we might not have usage endpoint
    // Return a default response
    return {
      used: 0,
      total: 0,
    };
  }

  async models(): Promise<LLMModel[]> {
    const accessStore = useAccessStore.getState();

    try {
      const baseUrl = this.getBaseUrl();

      // Validate API key
      if (!accessStore.unifiedApiKey) {
        console.warn("[Unified API] API key is not configured");
        return [];
      }

      // Try to fetch models from the unified API endpoint
      const url = baseUrl + "/v1/models";
      console.log("[Unified API] Fetching models from:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessStore.unifiedApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("[Unified API] Received models data:", data);

        if (!data.data || !Array.isArray(data.data)) {
          console.warn(
            "[Unified API] Invalid response format, expected data array",
          );
          return [];
        }

        const models = data.data.map((m: any) => ({
          name: m.id,
          available: true,
          provider: this.createProviderFromOwnedBy(m.owned_by || "unknown"),
          sorted: 0,
        }));

        console.log(
          "[Unified API] Successfully processed",
          models.length,
          "models",
        );
        return models;
      } else {
        console.error("[Unified API] HTTP error:", res.status, res.statusText);
        return [];
      }
    } catch (error) {
      console.error("[Unified API] Failed to fetch models:", error);
      return [];
    }
  }

  private createProviderFromOwnedBy(ownedBy: string): LLMModelProvider {
    // Map owned_by values to friendly provider names
    const providerMapping: Record<
      string,
      { name: string; type: string; sorted: number }
    > = {
      openai: { name: "OpenAI", type: "openai", sorted: 1 },
      anthropic: { name: "Anthropic", type: "anthropic", sorted: 2 },
      google: { name: "Google", type: "google", sorted: 3 },
      meta: { name: "Meta", type: "meta", sorted: 4 },
      mistral: { name: "Mistral", type: "mistral", sorted: 5 },
      cohere: { name: "Cohere", type: "cohere", sorted: 6 },
      custom: { name: "Custom Models", type: "custom", sorted: 7 },
      unknown: { name: "Other Models", type: "unknown", sorted: 99 },
    };

    // Normalize owned_by to lowercase for matching
    const normalizedOwnedBy = ownedBy.toLowerCase();

    // Try exact match first
    if (providerMapping[normalizedOwnedBy]) {
      const mapping = providerMapping[normalizedOwnedBy];
      return {
        id: normalizedOwnedBy,
        providerName: mapping.name,
        providerType: mapping.type,
        sorted: mapping.sorted,
      };
    }

    // Try partial matching for common patterns
    for (const [key, mapping] of Object.entries(providerMapping)) {
      if (normalizedOwnedBy.includes(key) || key.includes(normalizedOwnedBy)) {
        return {
          id: normalizedOwnedBy,
          providerName: mapping.name,
          providerType: mapping.type,
          sorted: mapping.sorted,
        };
      }
    }

    // Fallback to capitalized version of owned_by
    const capitalizedName =
      ownedBy.charAt(0).toUpperCase() + ownedBy.slice(1).toLowerCase();
    return {
      id: normalizedOwnedBy,
      providerName: capitalizedName,
      providerType: normalizedOwnedBy,
      sorted: 50, // Middle priority for unknown providers
    };
  }
}
