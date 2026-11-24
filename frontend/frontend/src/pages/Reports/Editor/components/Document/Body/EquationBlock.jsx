import { BlockMath } from "react-katex";

export default function EquationBlock({
  equation,
  number,
}) {
  return (
    <div className="my-10 flex justify-center">
      <div className="flex items-center gap-6">
        <BlockMath math={equation} />

        {number && (
          <span className="text-gray-500">
            ({number})
          </span>
        )}
      </div>
    </div>
  );
}