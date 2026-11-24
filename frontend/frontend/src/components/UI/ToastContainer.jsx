export default function ToastContainer({

  children,

}) {

  return (

    <div
      className="
        fixed
        top-5
        right-5
        z-[9999]
        flex
        flex-col
        gap-4
      "
    >

      {children}

    </div>

  );

}