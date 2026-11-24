export default function Chapter({

  number,

  title,

  children,

}) {

  return (

    <section className="mb-20">

      <h1 className="text-4xl font-bold mb-10">

        Chapitre {number}

      </h1>

      <h2 className="text-3xl font-semibold mb-8">

        {title}

      </h2>

      {children}

    </section>

  );

}