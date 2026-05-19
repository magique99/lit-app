/** Înlocuiește tag-urile de bloc HTML cu dublu `\n` și elimin cele rămase. */
export function htmlToPlainTextWithNewlines(
  content: string | null | undefined,
): string {
  if (!content) return "";

  return content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(
      /<\/(?:p|div|h[1-6]|li)>|<br\s?\/?>|<(?:(?:p|div|h[1-6]|li)[\s>])/gi,
      "\n\n",
    )
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function toPlainText(content: string | null | undefined) {
  if (!content) return "";

  return content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
