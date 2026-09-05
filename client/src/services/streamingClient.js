const AUTH_TOKEN = "wednesday-secret-local-handshake-token-2026";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function streamChatResponse({
  message,
  conversationId,
  persona,
  options,
  attachments,
  onChunk,
  onStatus,
  onDone,
  onError,
  signal
}) {
  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-wednesday-handshake": AUTH_TOKEN
      },
      body: JSON.stringify({
        message,
        conversationId,
        persona,
        options,
        attachments
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "status" && onStatus) {
              onStatus(data);
            } else if (data.type === "chunk" && onChunk) {
              onChunk(data.text);
            } else if (data.type === "done" && onDone) {
              onDone(data);
            } else if (data.type === "error" && onError) {
              onError(data.error);
            }
          } catch (e) {
            console.error("Error parsing stream line:", e);
          }
        }
      }
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Stream generation aborted by user.");
      if (onDone) onDone({ aborited: true });
    } else {
      console.error("Stream fetch error:", err);
      if (onError) onError(err.message || "Failed to fetch response stream");
    }
  }
}
