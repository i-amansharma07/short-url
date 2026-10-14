
"use client";

import { FormEvent, useState } from "react";

type ShortUrlResponse = {
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
};

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [result, setResult] = useState<ShortUrlResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ originalUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-2 text-3xl font-bold">
        URL Shortener
      </h1>

      <p className="mb-6 text-gray-600">
        Enter a URL to generate a short link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          required
          value={originalUrl}
          onChange={(event) => setOriginalUrl(event.target.value)}
          placeholder="https://example.com/your-long-url"
          className="w-full rounded border p-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Shorten URL"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-6 space-y-3 rounded border p-4">
          <p className="font-semibold">Your shortened URL</p>

          <a
            href={result.shortUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all text-blue-600 underline"
          >
            {result.shortUrl}
          </a>

          <p className="text-sm text-gray-600">
            Shortcode: {result.shortCode}
          </p>

          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(result.shortUrl)
            }
            className="rounded border px-3 py-2"
          >
            Copy link
          </button>
        </section>
      )}
    </main>
  );
}
