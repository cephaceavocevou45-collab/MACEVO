export default function RibbonDivider({

  vertical = true,

}) {

  if (vertical) {

    return (

      <div

        className="
          w-px
          self-stretch
          bg-gray-300
          mx-2
        "

      />

    );

  }

  return (

    <div

      className="
        h-px
        w-full
        bg-gray-300
        my-2
      "

    />

  );

}