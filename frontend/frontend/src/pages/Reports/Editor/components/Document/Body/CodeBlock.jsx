export default function CodeBlock({

  language,

  children,

}) {

  return (

    <pre
      className="
        bg-slate-900
        text-green-300
        rounded-lg
        p-6
        overflow-auto
        my-8
      "
    >

      <code>

        {children}

      </code>

    </pre>

  );

}