import { apiClient } from "./Promotion";

const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const asString = (value) => (value == null ? "" : String(value));

/**
 * @typedef {Object} SmmAnalyzeResult
 * @property {Object} source
 * @property {Object} metrics
 * @property {Object} ai
 * @property {Object} ai_status
 * @property {Array<Object>} competitors_found
 * @property {Array<Object>} recommendations
 */

/**
 * @typedef {Object} SmmGenerateResult
 * @property {string} text
 * @property {string} content_type
 * @property {string} theme
 * @property {string} tone
 * @property {boolean} published
 * @property {Array<Object>} knowledge_chunks
 * @property {string} generated_image_base64
 * @property {string} generated_image_mime_type
 * @property {string} image_prompt
 */

function normalizeAnalyze(data) {
  const normalized = asObject(data);
  const metrics = asObject(normalized.metrics);

  return {
    ...normalized,
    source: asObject(normalized.source),
    metrics: {
      total_posts_analyzed: Number(metrics.total_posts_analyzed || 0),
      average_views: Number(metrics.average_views || 0),
      average_likes: Number(metrics.average_likes || 0),
      average_comments: Number(metrics.average_comments || 0),
      posts_per_day: Number(metrics.posts_per_day || 0),
      top_posts: asArray(metrics.top_posts),
    },
    ai: {
      summary: asString(normalized.ai?.summary),
      search_tags: asArray(normalized.ai?.search_tags),
      audience_interests: asArray(normalized.ai?.audience_interests),
      audience_activity: asArray(normalized.ai?.audience_activity),
    },
    ai_status: {
      available: Boolean(normalized.ai_status?.available),
      message: asString(normalized.ai_status?.message),
    },
    competitors_found: asArray(normalized.competitors_found),
    recommendations: asArray(normalized.recommendations),
  };
}

function normalizeGenerate(data) {
  const normalized = asObject(data);

  return {
    ...normalized,
    text: asString(normalized.text),
    content_type: asString(normalized.content_type || "text"),
    theme: asString(normalized.theme),
    tone: asString(normalized.tone),
    published: Boolean(normalized.published),
    knowledge_chunks: asArray(normalized.knowledge_chunks),
    generated_image_base64: asString(normalized.generated_image_base64),
    generated_image_mime_type: asString(
      normalized.generated_image_mime_type || "image/png",
    ),
    image_prompt: asString(normalized.image_prompt),
  };
}

const toError = (error, fallback) => {
  const message =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback;
  return new Error(message);
};

export const SmmApi = {
  analyzeGroup: async (payload) => {
    try {
      const response = await apiClient.post("/vk/group/analyze", payload);
      return normalizeAnalyze(response.data);
    } catch (error) {
      throw toError(error, "Не удалось выполнить анализ VK-группы.");
    }
  },

  generatePost: async (payload) => {
    try {
      const response = await apiClient.post("/vk/posts/generate", payload);
      return normalizeGenerate(response.data);
    } catch (error) {
      throw toError(error, "Не удалось сгенерировать контент.");
    }
  },

  regenerateImage: async (payload) => {
    try {
      const response = await apiClient.post("/vk/posts/regenerate-image", payload);
      return {
        image_prompt: asString(response.data?.image_prompt),
        generated_image_base64: asString(response.data?.generated_image_base64),
        generated_image_mime_type: asString(
          response.data?.generated_image_mime_type || "image/png",
        ),
      };
    } catch (error) {
      throw toError(error, "Не удалось перегенерировать изображение.");
    }
  },

  publishPost: async (payload) => {
    try {
      const response = await apiClient.post("/vk/posts/publish", payload);
      return asObject(response.data);
    } catch (error) {
      throw toError(error, "Не удалось опубликовать пост.");
    }
  },
};
