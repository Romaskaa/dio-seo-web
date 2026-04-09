import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  const isContentGen =
    location.pathname === "/" ||
    location.pathname.startsWith("/generate/content");
  const isPromotion = location.pathname.startsWith("/seo");
  const isSmm = location.pathname.startsWith("/smm");

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-dark-800/95 backdrop-blur-md border-b border-neutral-800/50">
      <div className="flex h-20 lg:h-24 items-center gap-3 px-4 sm:px-6 lg:px-12 max-w-screen-2xl mx-auto">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src="http://80.93.62.177:8000/media/images/Logo_bez_fona_bez_teksta.width-80.height-80.png"
            alt="Логотип"
            className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
          />
          <span className="hidden sm:block text-white font-semibold text-xl tracking-tight">
            ДИО-Консалт
          </span>
        </Link>

        <div className="ml-auto min-w-0 max-w-full flex items-center gap-2 sm:gap-3 lg:gap-4 bg-neutral-900/70 backdrop-blur-md border border-neutral-800 rounded-3xl p-1.5 sm:p-2">
          <Link
            to="/seo"
            className={`px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base font-medium transition-all whitespace-normal wrap-break-word text-center min-w-0 ${
              isPromotion
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <span className="sm:hidden">SEO</span>
            <span className="hidden sm:inline">Продвижение сайта</span>
          </Link>

          <Link
            to="/smm"
            className={`px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base font-medium transition-all whitespace-normal wrap-break-word text-center min-w-0 ${
              isSmm
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <span className="sm:hidden">SMM</span>
            <span className="hidden sm:inline">SMM</span>
          </Link>

          <Link
            to="/generate/content"
            className={`px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base font-medium transition-all whitespace-normal wrap-break-word text-center min-w-0 ${
              isContentGen
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <span className="sm:hidden">Контент</span>
            <span className="hidden sm:inline">Генерация контента</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
