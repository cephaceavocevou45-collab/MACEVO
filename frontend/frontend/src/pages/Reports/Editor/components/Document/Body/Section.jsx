export default function Section({

  number,

  title,

  children,

}) {

  return (

    <section className="mb-12">

      <h2 className="text-2xl font-bold mb-6">

        {number} {title}

      </h2>

      {children}

    </section>

  );

}