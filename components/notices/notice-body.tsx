/** Texte d'une information : paragraphes et retours à la ligne, liens https cliquables. */
export function NoticeBody({ text, className = "" }: { text: string; className?: string }) {
  if (!text.trim()) return null;
  return (
    <div className={"space-y-2 " + className}>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p.split(/(https:\/\/[^\s]+)/g).map((part, j) =>
            /^https:\/\//.test(part) ? <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="font-semibold underline">{part}</a> : part,
          )}
        </p>
      ))}
    </div>
  );
}
