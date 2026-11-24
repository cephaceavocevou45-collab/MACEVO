export default function TableBlock({

  title,

  number,

  children,

}) {

  return (

    <div className="my-10 overflow-x-auto">

      <table className="w-full border border-gray-300">

        {children}

      </table>

      <p className="text-center mt-3 text-gray-600">

        Tableau {number} : {title}

      </p>

    </div>

  );

}