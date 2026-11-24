export default function ProgressBar({ value = 0 }) {
  return (
    <div className="mt-4">

      <div className="flex justify-between text-sm text-gray-500 mb-1">

        <span>Progression</span>

        <span>{value}%</span>

      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">

        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />

      </div>

    </div>
  );
}