/** SDK versions can reject newer rich-text nodes. Keep readable text without sending
 * malformed values back through the same validator or failing the entire tree. */
export function plainTextFallback(value: unknown, depth = 0): string {
 if (depth > 12 || value == null) return '';
 if (typeof value === 'string') return value;
 if (Array.isArray(value)) return value.map(v => plainTextFallback(v, depth + 1)).join('');
 if (typeof value !== 'object') return '';
 const v = value as Record<string, unknown>;
 if (typeof v.text === 'string') return v.text;
 for (const key of ['text','children','content','label','frontLabel','textOfDeletedRem']) {
  const text = plainTextFallback(v[key], depth + 1); if (text) return text;
 }
 if (v.i === 'i' || v.type === 'image') return typeof v.title === 'string' ? `[이미지: ${v.title}]` : '[이미지]';
 if (v.i === 'q' || v.type === 'rem') return '[참조]';
 if (v.i === 'a') return '[오디오]';
 return '';
}
export async function readableText(value: unknown, convert: (v: any) => Promise<string>) {
 if (value == null) return { text: '', fallback: false };
 if (typeof value === 'string') return { text: value, fallback: false };
 try {
  const text = await convert(value);
  if (typeof text === 'string') return { text, fallback: false };
 } catch { /* Continue with the compatible local reader. */ }
 const text = plainTextFallback(value);
 return { text: text || '[텍스트로 표시할 수 없는 항목]', fallback: true };
}
