export function IslandEvidenceLinks({ urls, japanese }: { urls?: string[]; japanese: boolean }) {
  const links = [...new Set(urls)].filter(url => typeof url === 'string' && url.startsWith('https://'));
  if (!links.length) return null;
  return (
    <details className="mt-1">
      <summary className="cursor-pointer">{japanese ? '表示の根拠' : 'Sources for this display'}</summary>
      {links.map(url => (
        <a key={url} className="block break-all underline" href={url} target="_blank" rel="noreferrer">{url}</a>
      ))}
    </details>
  );
}
