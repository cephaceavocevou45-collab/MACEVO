export default function UniversityHeader({
  logo,
  university,
  faculty,
  department,
}) {
  return (
    <div className="flex items-center gap-6 border-b pb-6 mb-8">
      {logo && (
        <img
          src={logo}
          alt={university}
          className="w-20 h-20 object-contain"
        />
      )}

      <div>
        <h1 className="text-2xl font-bold">
          {university}
        </h1>

        <p className="text-lg">
          {faculty}
        </p>

        <p className="text-gray-600">
          {department}
        </p>
      </div>
    </div>
  );
}