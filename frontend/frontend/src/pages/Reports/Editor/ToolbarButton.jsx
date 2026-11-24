export default function ToolbarButton({

  Icon,

  tooltip,

  onClick,

}) {

  return (

    <button

      title={tooltip}

      onClick={onClick}

      className="
        p-2
        rounded-lg
        hover:bg-gray-100
        transition
      "

    >

      <Icon size={20} />

    </button>

  );

}