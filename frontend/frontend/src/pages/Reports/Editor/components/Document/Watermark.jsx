export default function Watermark({

  text = "MACEVO",

}) {

  return (

    <div
      className="
        absolute
        inset-0
        flex
        items-center
        justify-center
        pointer-events-none
        opacity-5
        text-8xl
        font-bold
        rotate-[-35deg]
      "
    >

      {text}

    </div>

  );

}