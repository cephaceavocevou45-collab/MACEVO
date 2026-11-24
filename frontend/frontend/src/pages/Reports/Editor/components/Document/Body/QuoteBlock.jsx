export default function QuoteBlock({

  author,

  children,

}) {

  return (

    <blockquote

      className="
        border-l-4
        border-blue-500
        pl-6
        italic
        my-8
      "

    >

      <p>

        {children}

      </p>

      {author && (

        <footer className="mt-4 text-right">

          — {author}

        </footer>

      )}

    </blockquote>

  );

}