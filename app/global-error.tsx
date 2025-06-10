"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global error caught:", error);
  console.error("Error stack:", error.stack);
  console.error("Error message:", error.message);

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <p>Error: {error.message}</p>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
