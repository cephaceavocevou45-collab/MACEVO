export default function DocumentMeta({

  type,

  academicYear,

}) {

  return (

    <div className="mt-10 flex justify-between">

      <span>

        {type}

      </span>

      <span>

        {academicYear}

      </span>

    </div>

  );

}