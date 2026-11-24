export default function FigureBlock({

  src,

  alt,

  caption,

  number,

}) {

  return (

    <figure className="my-10">

      <img

        src={src}

        alt={alt}

        className="mx-auto rounded-lg"

      />

      <figcaption

        className="text-center text-gray-600 mt-4"

      >

        Figure {number} : {caption}

      </figcaption>

    </figure>

  );

}