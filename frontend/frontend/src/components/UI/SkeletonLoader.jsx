export default function SkeletonLoader({

  className = "",

  rounded = "rounded-lg",

}) {

  return (

    <div

      className={`
        animate-pulse
        bg-gray-200
        dark:bg-gray-700
        ${rounded}
        ${className}
      `}

    />

  );

}