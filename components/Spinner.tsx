export default function Spinner() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
      <div
        className="w-2 h-2 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "0.15s" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-current animate-bounce"
        style={{ animationDelay: "0.3s" }}
      />
    </div>
  );
}