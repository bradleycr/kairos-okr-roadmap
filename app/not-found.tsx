// --- KairOS Not Found: A Beautiful 404 Experience ---
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-minimal">
        <h2 className="text-2xl font-mono font-bold gradient-text mb-4">
          404: Not Found
        </h2>
        <p className="text-sm text-foreground mb-6">
          The page you're looking for doesn't exist.<br />
          Try checking the URL or return to the home screen.
        </p>
        <a
          href="/"
          className="w-full block py-2.5 px-4 text-center bg-primary text-primary-foreground font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-all duration-200"
        >
          Go Home
        </a>
      </div>
    </main>
  );
} 