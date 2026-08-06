export default function EmptyState({ icon: Icon, title, description, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-ink-100 dark:bg-ink-800">
          <Icon size={40} className="text-ink-400 dark:text-ink-500" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
      {description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
