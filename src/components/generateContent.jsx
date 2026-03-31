import { useState } from "react";
import { Upload, FileText, X, MessageCircle } from "lucide-react";
import Header from "./layout/Header";
import ChatMessageList from "./ChatMessageList";
import ChatInputBox from "./ChatInputBox";

const MOCK_UPLOADED_HISTORY = [
  {
    id: "kb-1",
    name: "tone-of-voice-guide.pdf",
    sizeKb: 284,
    uploadedAt: "24.03.2026 12:10",
  },
  {
    id: "kb-2",
    name: "product-faq.docx",
    sizeKb: 96,
    uploadedAt: "25.03.2026 09:42",
  },
  {
    id: "kb-3",
    name: "target-audience-notes.txt",
    sizeKb: 18,
    uploadedAt: "25.03.2026 20:05",
  },
];

const MOCK_CHAT_MESSAGES = [
  {
    id: 1,
    type: "ai",
    text: "База знаний подключена. Могу подготовить пост, статью или контент-план.",
    sources: ["tone-of-voice-guide.pdf", "product-faq.docx"],
  },
  {
    id: 2,
    type: "user",
    text: "Сделай короткий пост для Telegram про запуск новой функции.",
  },
  {
    id: 3,
    type: "ai",
    text: "Готово! Сделал пост в дружелюбном стиле бренда и добавил акцент на ценность для пользователя.",
    sources: ["tone-of-voice-guide.pdf"],
  },
];

const MOCK_AI_REPLIES = [
  "Собрал черновик на основе базы знаний. Могу сделать более формальный или более продающий вариант.",
  "Подготовил текст с учетом FAQ и позиционирования продукта. Если нужно, добавлю CTA.",
  "Сгенерировал вариант контента и сохранил тональность бренда. Готов адаптировать под нужный канал.",
];

export default function ContentGenerationPage() {
  const [files, setFiles] = useState([]);
  const [historyFiles, setHistoryFiles] = useState(MOCK_UPLOADED_HISTORY);
  const [messages, setMessages] = useState(MOCK_CHAT_MESSAGES);
  const [inputMessage, setInputMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Загрузка файлов
  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    setIsUploading(true);

    // Имитация загрузки
    setTimeout(() => {
      const now = new Date();
      const uploadedAt = now.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const newFilesForHistory = selectedFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        sizeKb: Number((file.size / 1024).toFixed(1)),
        uploadedAt,
      }));
      setFiles((prev) => [...prev, ...selectedFiles]);
      setHistoryFiles((prev) => [...newFilesForHistory, ...prev]);
      setIsUploading(false);
      setIsHistoryOpen(true);
    }, 800);
  };

  // Удаление файла
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Отправка сообщения в чат
  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputMessage.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    setTimeout(() => {
      const randomReply =
      MOCK_AI_REPLIES[Math.floor(Math.random() * MOCK_AI_REPLIES.length)];
      const aiReply = {
        id: Date.now() + 1,
        type: "ai",
        text: randomReply,
        sources: historyFiles.slice(0, 2).map((file) => file.name),
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 900);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <div className="pt-24 lg:pt-28 px-6 lg:px-12 max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Левая колонка — Только загрузка файлов */}
          <div className="lg:col-span-4">
            <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-3xl p-8 h-full">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <Upload className="w-6 h-6 text-red-400" />
                Загрузка файлов в базу знаний
              </h2>

              {/* Область загрузки */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-700 hover:border-red-500/50 rounded-2xl py-16 cursor-pointer transition-colors">
                <Upload className="w-12 h-12 text-neutral-500 mb-4" />
                <p className="text-neutral-400 text-center">
                  Перетащите файлы сюда
                  <br />
                  или нажмите для выбора
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  PDF, DOCX, TXT, JPG, PNG
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Список загруженных файлов */}
              {files.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm text-neutral-400 mb-4">
                    Загруженные файлы:
                  </p>
                  <div className="space-y-3">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-[#0f0f0f] border border-neutral-800 rounded-2xl px-5 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-red-400" />
                          <div>
                            <p className="text-sm truncate max-w-[220px]">
                              {file.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Кнопка теперь только "Загрузить файл" */}
              <button
                onClick={() =>
                  document.querySelector('input[type="file"]').click()
                }
                disabled={isUploading}
                className="mt-8 w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-neutral-700 disabled:cursor-not-allowed rounded-2xl font-medium transition-all active:scale-[0.985]"
              >
                {isUploading ? "Загружаем..." : "Загрузить файл"}
              </button>

              <button
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className="mt-3 w-full py-3 bg-[#131313] hover:bg-[#171717] border border-neutral-700 rounded-2xl text-sm font-medium transition-colors"
              >
                {isHistoryOpen
                  ? "Скрыть загруженные файлы"
                  : "Посмотреть загруженные файлы"}
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  isHistoryOpen ? "max-h-[340px] opacity-100 mt-4" : "max-h-0 opacity-0"
                }`}
              >
                <div className="bg-[#0f0f0f] border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="p-4 space-y-3 overflow-y-auto max-h-[320px] pr-2">
                    {historyFiles.length === 0 ? (
                      <p className="text-sm text-neutral-500">
                        История пока пустая
                      </p>
                    ) : (
                      historyFiles.map((file) => (
                        <div
                          key={file.id}
                          className="border border-neutral-800 rounded-xl px-3 py-2"
                        >
                          <p className="text-sm truncate">{file.name}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {file.sizeKb} KB • {file.uploadedAt}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка — Чат "Генерация контента по базе знаний" */}
          <div className="lg:col-span-8">
            <div className="bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-3xl h-full flex flex-col overflow-hidden min-h-[620px]">
              {/* Шапка чата */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-500/10 rounded-2xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      Генерация контента по базе знаний
                    </div>
                    <div className="text-xs text-neutral-500">
                      AI готов к работе
                    </div>
                  </div>
                </div>
              </div>

              {/* Сообщения чата */}
              <ChatMessageList
                messages={messages}
                className="flex-1 p-6 overflow-y-auto space-y-6 text-sm"
                renderMeta={(msg) =>
                  msg.sources?.length > 0 ? (
                    <p className="text-xs text-neutral-400 mt-2">
                      Источники: {msg.sources.join(", ")}
                    </p>
                  ) : null
                }
              />

              {/* Поле ввода чата */}
              <div className="p-4 border-t border-neutral-800 shrink-0">
                <ChatInputBox
                  value={inputMessage}
                  onChange={setInputMessage}
                  onKeyDown={handleKeyPress}
                  onSend={sendMessage}
                  placeholder="Опишите, какой контент нужно сгенерировать..."
                  disabled={!inputMessage.trim()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}