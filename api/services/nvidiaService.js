import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

function plainTextAiOutput(content) {
  return String(content || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line
      .replace(/^\s{0,3}#{1,6}\s*/g, "")
      .replace(/^\s*[*]+\s+/g, "")
      .replace(/^\s*[-]\s+/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[#$*]/g, "")
      .trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function withPlainTextInstruction(messages) {
  const instruction = "Formatting rule: reply in plain text only. Do not use Markdown. Do not use # headings. Do not use * bullets or bold markers. Use simple section labels and numbered lines if needed.";
  return [
    {
      role: "system",
      content: instruction
    },
    ...messages
  ];
}

export class NvidiaService {
  configured() {
    return Boolean(env.nvidia.apiKey);
  }

  async complete(messages, {
    temperature = 1,
    maxTokens = 512,
    topP = 1,
    frequencyPenalty = 0,
    presencePenalty = 0,
    stream = false
  } = {}) {
    if (!this.configured()) {
      throw new AppError("Real NVIDIA AI requires NVIDIA_API_KEY in .env.", 503, "NVIDIA_NOT_CONFIGURED");
    }

    const invokeUrl = `${env.nvidia.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const response = await fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": stream ? "text/event-stream" : "application/json",
        "Authorization": `Bearer ${env.nvidia.apiKey}`
      },
      body: JSON.stringify({
        model: env.nvidia.model,
        messages: withPlainTextInstruction(messages),
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        stream
      })
    });

    if (!response.ok) {
      const body = await response.text();
      let detail = body.slice(0, 500);
      try {
        const parsed = JSON.parse(body);
        detail = parsed.error?.message || parsed.detail || detail;
      } catch {
        // Keep the raw text detail when NVIDIA returns non-JSON errors.
      }
      throw new AppError(`NVIDIA API request failed: ${detail}`, response.status, "NVIDIA_API_ERROR");
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content || payload.choices?.[0]?.delta?.content || "";
    return {
      configured: true,
      provider: "nvidia",
      model: env.nvidia.model,
      content: plainTextAiOutput(content) || "No content returned by NVIDIA model.",
      usage: payload.usage || null
    };
  }

  chat(prompt) {
    return this.complete([
      {
        role: "system",
        content: "You are MAT LEADS AI PRO X, a practical agency growth assistant. Give concise, useful, revenue-focused answers. Use plain text only, with no Markdown symbols."
      },
      {
        role: "user",
        content: prompt
      }
    ]);
  }

  analyzeLead(lead) {
    return this.complete([
      {
        role: "system",
        content: "You are an expert agency growth strategist. Produce concise, factual lead analysis with no unsupported claims. Use plain text only, with no Markdown symbols."
      },
      {
        role: "user",
        content: `Analyze this lead for website, SEO, AI automation, and marketing opportunity. Return plain text sections with labels only: Opportunity, Problems, Offer, First Outreach Angle, Revenue Estimate. Do not use # or * characters.\n\n${JSON.stringify(lead, null, 2)}`
      }
    ], { temperature: 0.35, maxTokens: 700 });
  }

  writeOutreach(lead, type) {
    return this.complete([
      {
        role: "system",
        content: "You write professional B2B outreach for web development, SEO, marketing, and AI automation agencies. Be specific, respectful, and conversion focused. Use plain text only, with no Markdown symbols."
      },
      {
        role: "user",
        content: `Write a ${type} for this business lead. Include a subject line, concise email body, and a clear CTA. Do not use # or * characters.\n\n${JSON.stringify(lead, null, 2)}`
      }
    ], { temperature: 0.35, maxTokens: 700 });
  }
}
