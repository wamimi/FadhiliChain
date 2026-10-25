export function PreviewNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`rounded-2xl bg-sand px-4 py-3 text-sm text-ink ${className}`}>
      <b>Sample fundraisers.</b> These examples show how FadhiliChain works. Live fundraisers appear here soon.
    </p>
  );
}
