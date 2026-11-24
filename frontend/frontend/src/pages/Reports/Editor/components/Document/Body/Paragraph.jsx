export default function Paragraph({

  children,

}) {

  return (

    <p

      className="
        text-justify
        leading-8
        indent-10
        mb-6
      "

    >

      {children}

    </p>

  );

}