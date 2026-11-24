import { toolbarButtons } from "./toolbarConfig";
import ToolbarButton from "./ToolbarButton";

import { useEditorContext } from "./EditorContext";

export default function Toolbar() {

  const editor = useEditorContext();

  if (!editor) return null;

  return (

    <header className="bg-white border-b p-3">

      <div className="flex items-center gap-2 flex-wrap">

        {toolbarButtons.map((button) => (

          <ToolbarButton

            key={button.id}

            Icon={button.icon}

            tooltip={button.tooltip}
            

            onClick={() =>
              button.command?.(editor)

            }


          />

        ))}

      </div>

    </header>

  );

}