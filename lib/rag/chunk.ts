export type Chunk = {
  content: string;
  heading: string;
  source: string;
};

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function chunkMarkdown(markdown: string, source: string): Chunk[] {
  const lines = markdown.split(/\r?\n/);
  const chunks: Chunk[] = [];
  let heading = "Intro";
  let buffer: string[] = [];

  const flush = () => {
    if (!buffer.length) return;
    const content = clean(buffer.join(" \n "));
    if (content) {
      chunks.push({ content, heading, source });
    }
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flush();
      heading = headingMatch[2].trim();
      continue;
    }

    if (line.trim() === "") {
      flush();
      continue;
    }

    buffer.push(line.trim());
  }

  flush();
  return chunks;
}
