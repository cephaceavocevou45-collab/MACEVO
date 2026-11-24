import { Inbox } from "lucide-react";

import Button from "./Button";

export default function EmptyState({

  icon = <Inbox size={60} className="text-gray-400" />,

  title = "Aucune donnée",

  description = "Il n'y a rien à afficher pour le moment.",

  buttonText,

  onButtonClick,

}) {

  return (

    <div className="flex flex-col items-center justify-center py-20 text-center">

      {icon}

      <h2 className="mt-6 text-2xl font-bold text-gray-800">

        {title}

      </h2>

      <p className="mt-3 max-w-md text-gray-500">

        {description}

      </p>

      {buttonText && (

        <div className="mt-8">

          <Button onClick={onButtonClick}>

            {buttonText}

          </Button>

        </div>

      )}

    </div>

  );

}