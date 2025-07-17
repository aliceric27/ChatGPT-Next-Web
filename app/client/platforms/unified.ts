"use client";

import type { ChatOptions, LLMModel, LLMUsage, SpeechOptions } from "../api";
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
    const baseUrl = this.getBaseUrl();

    try {
      // Try to fetch models from the unified API endpoint
      const url = baseUrl + "/v1/models";
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessStore.unifiedApiKey}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        return (
          data.data?.map((m: any) => ({
            name: m.id,
            available: true,
            provider: {
              id: "unified",
              providerName: "Unified API",
              providerType: accessStore.unifiedApiFormat,
              sorted: 0,
            },
            sorted: 0,
          })) || []
        );
      }
    } catch (error) {
      console.error("[Unified API] Failed to fetch models", error);
    }

    // Return empty array if failed
    return [];
  }
}
