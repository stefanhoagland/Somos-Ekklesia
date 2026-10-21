export function Avisos({ error, aviso }: { error?: string; aviso?: string }) {
  return (
    <>
      {error && <p className="rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}
      {aviso && <p className="rounded-lg bg-green-100 p-3 text-green-800">{aviso}</p>}
    </>
  );
}
