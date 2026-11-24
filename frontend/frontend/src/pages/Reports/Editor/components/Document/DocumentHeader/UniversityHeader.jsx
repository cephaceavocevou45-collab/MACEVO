export default function UniversityHeader({

  university,

  faculty,

  department,

  logo,

}) {

  return (

    <div className="flex items-center gap-6 mb-8">

      {logo && (

        <img

          src={logo}

          alt={university}

          className="w-20 h-20 object-contain"

        />

      )}

      <div>

        <h2 className="text-2xl font-bold">

          {university}

        </h2>

        <p className="text-gray-600">

          {faculty}

        </p>

        <p className="text-gray-500">

          {department}

        </p>

      </div>

    </div>

  );

}