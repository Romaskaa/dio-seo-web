import { useMemo, useState } from "react";
import {
  Bot,
  Calendar,
  Clock,
  Copy,
  Image,
  MessageCircle,
  Send,
  Wand2,
} from "lucide-react";
import { SmmApi } from "../api/Smm";

const initialAnalyzeForm = {
  source: "",
  post_limit: 30,
  language: "ru",
};

const initialGenerateForm = {
  prompt: "",
  theme: "",
  tone: "",
  content_type: "text",
  publish: false,
  length: "medium",
  language: "ru",
};

const languageOptions = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

const contentTypeOptions = [
  { value: "text", label: "Текст" },
  { value: "story", label: "Сторис" },
  { value: "image", label: "Текст + изображение" },
  { value: "video", label: "Видео" },
];

const lengthOptions = [
  { value: "short", label: "Короткая" },
  { value: "medium", label: "Средняя" },
  { value: "long", label: "Длинная" },
];

const formatNumber = (value) =>
  new Intl.NumberFormat("ru-RU").format(Number(value || 0));

const formatDate = (unixTs) => {
  const value = Number(unixTs || 0);
  if (!value) return "-";
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function MetricsCard({ label, value }) {
  return (
    <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-4">
      <div className="text-xs uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function ModeButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-medium transition-colors bg-red-600 text-white hover:bg-red-500"
    >
      {children}
    </button>
  );
}

export default function SmmPage() {
  const [mode, setMode] = useState("analyze");
  const [analyzeForm, setAnalyzeForm] = useState(initialAnalyzeForm);
  const [generateForm, setGenerateForm] = useState(initialGenerateForm);
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [generateResult, setGenerateResult] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [editedImagePrompt, setEditedImagePrompt] = useState("");
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [regenerateImageLoading, setRegenerateImageLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [regenerateImageError, setRegenerateImageError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishSuccess, setPublishSuccess] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([
    {
      id: "assistant-welcome",
      type: "ai",
      text: "SMM-помощник готов. Могу подсказать, как интерпретировать результат и что улучшить в контенте.",
    },
  ]);

  const imageDataUrl = useMemo(() => {
    if (!generateResult?.generated_image_base64) return "";
    const mime = generateResult.generated_image_mime_type || "image/png";
    return `data:${mime};base64,${generateResult.generated_image_base64}`;
  }, [generateResult]);

  const sendAssistantMessage = () => {
    const text = assistantInput.trim();
    if (!text) return;

    const userMessage = { id: `${Date.now()}-u`, type: "user", text };

    const aiReplyText =
      mode === "analyze"
        ? analyzeResult
          ? "Сфокусируйтесь на метриках вовлеченности и блоке рекомендаций. Начните с 1-2 действий с максимальным эффектом."
          : "Сначала запустите анализ VK-группы, после этого я помогу разобрать результат."
        : generateResult
          ? "Проверьте тональность и длину текста. Для image-постов можно уточнить prompt и перегенерировать изображение."
          : "Сначала сгенерируйте контент, затем можно обсудить финальную редактуру перед публикацией.";

    const aiMessage = { id: `${Date.now()}-a`, type: "ai", text: aiReplyText };

    setAssistantMessages((prev) => [...prev, userMessage, aiMessage]);
    setAssistantInput("");
  };

  const handleAnalyzeSubmit = async (event) => {
    event.preventDefault();
    setAnalyzeError("");
    setAnalyzeLoading(true);
    try {
      const data = await SmmApi.analyzeGroup({
        source: analyzeForm.source.trim(),
        post_limit: Number(analyzeForm.post_limit) || 30,
        language: analyzeForm.language,
      });
      setAnalyzeResult(data);
    } catch (error) {
      setAnalyzeError(error.message);
      setAnalyzeResult(null);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleGenerateSubmit = async (event) => {
    event.preventDefault();
    setGenerateError("");
    setPublishError("");
    setPublishSuccess("");
    setRegenerateImageError("");
    setGenerateLoading(true);
    try {
      const data = await SmmApi.generatePost({
        ...generateForm,
        prompt: generateForm.prompt.trim(),
        theme: generateForm.theme.trim() || null,
        tone: generateForm.tone.trim() || null,
      });
      setGenerateResult(data);
      setEditedText(data.text || "");
      setEditedImagePrompt(data.image_prompt || "");
    } catch (error) {
      setGenerateError(error.message);
      setGenerateResult(null);
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleRegenerateImage = async () => {
    const postText = (editedText || generateResult?.text || "").trim();
    if (!postText) {
      setRegenerateImageError("Нет текста поста для генерации изображения.");
      return;
    }

    setRegenerateImageError("");
    setRegenerateImageLoading(true);
    try {
      const data = await SmmApi.regenerateImage({
        post_text: postText,
        image_prompt: editedImagePrompt.trim() || null,
        theme: generateResult?.theme || generateForm.theme || null,
        tone: generateResult?.tone || generateForm.tone || null,
        language: generateForm.language || "ru",
      });

      setEditedImagePrompt(data.image_prompt || "");
      setGenerateResult((prev) =>
        prev
          ? {
              ...prev,
              image_prompt: data.image_prompt,
              generated_image_base64: data.generated_image_base64,
              generated_image_mime_type: data.generated_image_mime_type,
            }
          : prev,
      );
    } catch (error) {
      setRegenerateImageError(error.message);
    } finally {
      setRegenerateImageLoading(false);
    }
  };

  const handlePublish = async () => {
    const message = editedText.trim();
    if (!message) {
      setPublishError("Текст пустой, нечего публиковать.");
      return;
    }

    setPublishError("");
    setPublishSuccess("");
    setPublishLoading(true);
    try {
      const result = await SmmApi.publishPost({ message });
      setGenerateResult((prev) =>
        prev
          ? {
              ...prev,
              text: message,
              published: true,
              post_id: result?.post_id ?? prev.post_id,
              owner_id: result?.owner_id ?? prev.owner_id,
            }
          : prev,
      );
      setPublishSuccess("Пост успешно опубликован.");
    } catch (error) {
      setPublishError(error.message);
    } finally {
      setPublishLoading(false);
    }
  };

  const analyzeTopPosts = analyzeResult?.metrics?.top_posts || [];

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="pt-24 lg:pt-28 px-6 lg:px-12 max-w-screen-2xl mx-auto pb-10">
        <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 lg:p-8">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="text-sm text-neutral-400">
              {mode === "analyze" ? "Страница анализа VK-групп" : "Страница генерации контента"}
            </div>
            <ModeButton
              onClick={() => setMode((prev) => (prev === "analyze" ? "generate" : "analyze"))}
            >
              {mode === "analyze" ? "Генерация контента" : "Анализ VK-групп"}
            </ModeButton>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            {mode === "analyze" ? (
              <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 lg:p-8">
                <h2 className="text-2xl font-semibold">Анализ VK-группы</h2>
                <p className="mt-2 text-neutral-400 text-sm">
                  Введите ссылку или идентификатор группы, затем получите разбор метрик, рекомендаций и конкурентов.
                </p>

                <form onSubmit={handleAnalyzeSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Ссылка / screen_name / id</label>
                    <input
                      value={analyzeForm.source}
                      onChange={(e) => setAnalyzeForm((prev) => ({ ...prev, source: e.target.value }))}
                      required
                      placeholder="https://vk.com/diocon"
                      className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">Лимит постов</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={analyzeForm.post_limit}
                        onChange={(e) => setAnalyzeForm((prev) => ({ ...prev, post_limit: e.target.value }))}
                        className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">Язык ответа</label>
                      <select
                        value={analyzeForm.language}
                        onChange={(e) => setAnalyzeForm((prev) => ({ ...prev, language: e.target.value }))}
                        className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                      >
                        {languageOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={analyzeLoading}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 px-6 py-3 rounded-2xl font-medium"
                  >
                    {analyzeLoading ? "Анализируем..." : "Запустить анализ"}
                  </button>
                </form>

                {analyzeError && (
                  <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                    {analyzeError}
                  </div>
                )}

                {analyzeResult ? (
                  <div className="mt-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <MetricsCard label="Постов проанализировано" value={formatNumber(analyzeResult.metrics.total_posts_analyzed)} />
                      <MetricsCard label="Средние просмотры" value={formatNumber(analyzeResult.metrics.average_views)} />
                      <MetricsCard label="Средние лайки" value={formatNumber(analyzeResult.metrics.average_likes)} />
                      <MetricsCard label="Средние комментарии" value={formatNumber(analyzeResult.metrics.average_comments)} />
                      <MetricsCard label="Постов в день" value={analyzeResult.metrics.posts_per_day} />
                    </div>

                    <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-5">
                      <div className="text-sm text-neutral-500 mb-2">Сводка</div>
                      <p className="text-neutral-200 leading-relaxed">{analyzeResult.ai.summary || "Сводка пока не предоставлена."}</p>
                    </div>

                    <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-5">
                      <div className="text-sm text-neutral-500 mb-2">Теги поиска конкурентов</div>
                      <div className="flex flex-wrap gap-2">
                        {analyzeResult.ai.search_tags.length ? (
                          analyzeResult.ai.search_tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 rounded-full text-xs bg-red-500/15 border border-red-500/30 text-red-200">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-neutral-500 text-sm">Теги не найдены</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-5">
                        <div className="text-sm text-neutral-500 mb-2">Интересы аудитории</div>
                        {analyzeResult.ai.audience_interests.length ? (
                          <ul className="list-disc pl-5 space-y-1 text-neutral-200">
                            {analyzeResult.ai.audience_interests.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-neutral-500 text-sm">Нет данных</span>
                        )}
                      </div>

                      <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-5">
                        <div className="text-sm text-neutral-500 mb-2">Активность аудитории</div>
                        {analyzeResult.ai.audience_activity.length ? (
                          <ul className="list-disc pl-5 space-y-1 text-neutral-200">
                            {analyzeResult.ai.audience_activity.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-neutral-500 text-sm">Нет данных</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-5 overflow-x-auto">
                      <div className="text-sm text-neutral-500 mb-3">Топ постов</div>
                      {analyzeTopPosts.length ? (
                        <table className="w-full text-sm">
                          <thead className="text-neutral-400">
                            <tr className="border-b border-neutral-800">
                              <th className="py-2 text-left font-medium">ID</th>
                              <th className="py-2 text-left font-medium">Дата</th>
                              <th className="py-2 text-left font-medium">Просмотры</th>
                              <th className="py-2 text-left font-medium">Лайки</th>
                              <th className="py-2 text-left font-medium">Комментарии</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analyzeTopPosts.map((post) => (
                              <tr key={`${post.post_id}-${post.date}`} className="border-b border-neutral-800/80">
                                <td className="py-2">{post.post_id}</td>
                                <td className="py-2">{formatDate(post.date)}</td>
                                <td className="py-2">{formatNumber(post.views)}</td>
                                <td className="py-2">{formatNumber(post.likes)}</td>
                                <td className="py-2">{formatNumber(post.comments)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-sm text-neutral-500">Топ постов недоступен.</div>
                      )}
                    </div>
                  </div>
                ) : (
                  !analyzeError && (
                    <div className="mt-8 border border-dashed border-neutral-700 rounded-2xl p-8 text-center text-neutral-500">
                      Запустите анализ группы, результат появится здесь.
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 lg:p-8">
                <h2 className="text-2xl font-semibold">Генерация контента</h2>
                <p className="mt-2 text-neutral-400 text-sm">
                  Создайте пост, отредактируйте текст, при необходимости перегенерируйте изображение и опубликуйте.
                </p>

                <form onSubmit={handleGenerateSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Промпт</label>
                    <textarea
                      value={generateForm.prompt}
                      onChange={(e) => setGenerateForm((prev) => ({ ...prev, prompt: e.target.value }))}
                      rows={5}
                      required
                      placeholder="Напиши пост про автоматизацию бизнеса"
                      className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">Тема</label>
                      <input
                        value={generateForm.theme}
                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, theme: e.target.value }))}
                        className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">Тон</label>
                      <input
                        value={generateForm.tone}
                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, tone: e.target.value }))}
                        className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">Тип контента</label>
                      <select
                        value={generateForm.content_type}
                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, content_type: e.target.value }))}
                        className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                      >
                        {contentTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">Длина</label>
                      <select
                        value={generateForm.length}
                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, length: e.target.value }))}
                        className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                      >
                        {lengthOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">Язык</label>
                      <select
                        value={generateForm.language}
                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, language: e.target.value }))}
                        className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                      >
                        {languageOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-neutral-400 mb-2">Сразу публиковать</label>
                      <select
                        value={generateForm.publish ? "yes" : "no"}
                        onChange={(e) => setGenerateForm((prev) => ({ ...prev, publish: e.target.value === "yes" }))}
                        className="w-full bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                      >
                        <option value="no">Нет</option>
                        <option value="yes">Да</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={generateLoading}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 px-6 py-3 rounded-2xl font-medium"
                  >
                    {generateLoading ? "Генерируем..." : "Сгенерировать"}
                  </button>
                </form>

                {generateError && (
                  <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                    {generateError}
                  </div>
                )}

                {generateResult ? (
                  <div className="mt-8 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-200 text-xs">
                        Тип: {generateResult.content_type}
                      </span>
                      {generateResult.theme && (
                        <span className="px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs">
                          Тема: {generateResult.theme}
                        </span>
                      )}
                      {generateResult.tone && (
                        <span className="px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs">
                          Тон: {generateResult.tone}
                        </span>
                      )}
                    </div>

                    <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-neutral-500">Готовый текст</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(editedText || "")}
                            className="px-3 py-2 rounded-xl text-xs bg-neutral-800 border border-neutral-700 hover:border-red-500/50"
                          >
                            <span className="inline-flex items-center gap-1">
                              <Copy className="w-3.5 h-3.5" /> Копировать
                            </span>
                          </button>
                          {!generateResult.published && (
                            <button
                              type="button"
                              onClick={handlePublish}
                              disabled={publishLoading}
                              className="px-3 py-2 rounded-xl text-xs bg-red-600 hover:bg-red-500 disabled:bg-neutral-700"
                            >
                              {publishLoading ? "Публикуем..." : "Опубликовать"}
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        rows={9}
                        className="mt-3 w-full bg-black/30 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                      />

                      {publishError && <div className="mt-3 text-sm text-red-300">{publishError}</div>}
                      {publishSuccess && <div className="mt-3 text-sm text-emerald-300">{publishSuccess}</div>}
                    </div>

                    {generateResult.content_type === "image" && (
                      <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="text-sm text-neutral-500">Промпт изображения</div>
                          <button
                            type="button"
                            onClick={handleRegenerateImage}
                            disabled={regenerateImageLoading}
                            className="px-3 py-2 rounded-xl text-xs bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 inline-flex items-center gap-1"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            {regenerateImageLoading ? "Перегенерация..." : "Перегенерировать изображение"}
                          </button>
                        </div>

                        <textarea
                          value={editedImagePrompt}
                          onChange={(e) => setEditedImagePrompt(e.target.value)}
                          rows={4}
                          className="w-full bg-black/30 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-3 text-white"
                        />

                        {regenerateImageError && <div className="text-sm text-red-300">{regenerateImageError}</div>}

                        <div className="border border-neutral-700 rounded-2xl p-4">
                          <div className="text-sm text-neutral-500 mb-3">Сгенерированное изображение</div>
                          {imageDataUrl ? (
                            <img src={imageDataUrl} alt="Сгенерированное изображение" className="max-w-full rounded-xl border border-neutral-700" />
                          ) : (
                            <div className="text-sm text-neutral-500">Изображение пока недоступно.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {generateResult.knowledge_chunks.length > 0 && (
                      <div className="bg-dark-800 border border-neutral-800 rounded-2xl p-5">
                        <div className="text-sm text-neutral-500 mb-3">Материалы базы знаний</div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {generateResult.knowledge_chunks.map((chunk, idx) => (
                            <div
                              key={`${chunk.filename || chunk.title || idx}-${idx}`}
                              className="bg-black/20 border border-neutral-700 rounded-xl p-3"
                            >
                              <div className="font-medium text-sm">{chunk.title || chunk.filename || "Фрагмент"}</div>
                              <div className="mt-1 text-xs text-neutral-500">Скор: {chunk.score}</div>
                              {chunk.snippet_preview && <p className="mt-2 text-sm text-neutral-300 line-clamp-3">{chunk.snippet_preview}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  !generateError && (
                    <div className="mt-8 border border-dashed border-neutral-700 rounded-2xl p-8 text-center text-neutral-500">
                      Сгенерируйте пост, и здесь появится редактор контента.
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="xl:col-span-4">
            <div className="xl:sticky xl:top-28 space-y-4">
              <button
                type="button"
                onClick={() => setAssistantOpen((prev) => !prev)}
                className="w-full py-4 rounded-3xl bg-neutral-900/70 backdrop-blur-md border border-neutral-800 hover:border-red-500/50 transition-colors flex items-center justify-center gap-3"
              >
                <div className="w-8 h-8 bg-red-500/10 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-red-400" />
                </div>
                <span className="font-medium">{assistantOpen ? "Скрыть помощника" : "Открыть помощника"}</span>
              </button>
              <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-3xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="font-semibold">SMM-статус</div>
                    <div className="text-xs text-neutral-500">{mode === "analyze" ? "Режим анализа" : "Режим генерации"}</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    <span>Анализ и генерация на одном экране</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-neutral-500" />
                    <span>Поддержка image-постов и перегенерации</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span>Inline ошибки и статусы без alert</span>
                  </div>
                </div>
              </div>

              {assistantOpen && (
                <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-3xl p-4 flex flex-col gap-3 max-h-[60vh]">
                  <div className="text-sm text-neutral-400">AI-помощник</div>
                  <div className="space-y-3 overflow-y-auto pr-1 custom-scroll">
                    {assistantMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          message.type === "user"
                            ? "bg-red-600 text-white ml-6"
                            : "bg-neutral-800 text-neutral-200 mr-6"
                        }`}
                      >
                        {message.text}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={assistantInput}
                      onChange={(e) => setAssistantInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          sendAssistantMessage();
                        }
                      }}
                      placeholder="Спросите про SMM"
                      className="flex-1 bg-dark-800 border border-neutral-700 focus:border-red-500 rounded-2xl px-4 py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={sendAssistantMessage}
                      className="w-10 h-10 rounded-2xl bg-red-600 hover:bg-red-500 flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
