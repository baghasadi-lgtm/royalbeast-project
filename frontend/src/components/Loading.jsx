export const Loading = ({ text = 'Memuat...' }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-3">
    <div className="w-8 h-8 border-2 border-line border-t-ink rounded-full animate-spin" />
    <p className="text-sm text-muted">{text}</p>
  </div>
);
