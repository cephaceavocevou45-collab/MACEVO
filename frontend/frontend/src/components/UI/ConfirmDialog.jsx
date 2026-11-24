import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({

  open,

  onClose,

  onConfirm,

  title = "Confirmation",

  message = "Êtes-vous sûr de vouloir continuer ?",

  confirmText = "Confirmer",

  cancelText = "Annuler",

  confirmColor = "bg-red-600 hover:bg-red-700",

}) {

  return (

    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
    >

      <div className="flex flex-col items-center text-center">

        <AlertTriangle
          size={60}
          className="text-red-500 mb-5"
        />

        <p className="text-gray-600">

          {message}

        </p>

        <div className="flex gap-4 mt-8 w-full">

          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            {cancelText}
          </Button>

          <Button
            className={`flex-1 text-white ${confirmColor}`}
            onClick={() => {

              onConfirm();

              onClose();

            }}
          >
            {confirmText}
          </Button>

        </div>

      </div>

    </Modal>

  );

}