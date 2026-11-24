export default function TableOfContents({

  items = [],

}) {

  return (

    <section>

      <h2 className="text-3xl font-bold mb-8">

        Table des matières

      </h2>

      <ul className="space-y-3">

        {items.map((item, index) => (

          <li
            key={index}
            className="flex justify-between"
          >

            <span>

              {item.title}

            </span>

            <span>

              {item.page}

            </span>

          </li>

        ))}

      </ul>

    </section>

  );

}