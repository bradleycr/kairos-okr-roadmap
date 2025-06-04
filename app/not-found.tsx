// --- KairOS Not Found: A Beautiful 404 Experience ---
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-teal-50">
      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-mono font-bold bg-gradient-to-r from-gray-800 via-teal-700 to-gray-800 bg-clip-text text-transparent mb-4">
          404: Not Found
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          The page you're looking for doesn't exist.<br />
          Try checking the URL or return to the home screen.
        </p>
        <a
          href="/"
          className="w-full block py-2.5 px-4 text-center bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-lg shadow-sm hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
        >
          Go Home
        </a>
      </div>
    </main>
  );
} 