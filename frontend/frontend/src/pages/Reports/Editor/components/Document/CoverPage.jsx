export default function CoverPage({

  title,

  author,

}) {

  return (

    <section
      className="
        flex
        flex-col
        justify-center
        items-center
        min-h-[297mm]
      "
    >

      <h1 className="text-5xl font-bold text-center">

        {title}

      </h1>

      <p className="mt-12 text-xl">

        {author}

      </p>

    </section>

  );

}