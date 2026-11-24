export default function SubSection({

  number,

  title,

  children,

}) {

  return (

    <section className="mb-8">

      <h3 className="text-xl font-semibold mb-4">

        {number} {title}

      </h3>

      {children}

    </section>

  );

}