/**
 * ==========================================================
 * MACEVO
 * ----------------------------------------------------------
 * Fichier : ScientificDiagramEditor.jsx
 * Version : 1.1.0
 * Statut  : Stable
 * ----------------------------------------------------------
 * Constructeur de schémas scientifiques
 * ==========================================================
 */

import { useMemo, useRef, useState } from "react";

import {
  X,
  MousePointer2,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Minus,
  Type,
  FlaskConical,
  Trash2,
  RotateCcw,
  Check,
} from "lucide-react";

/* ==========================================================
   DIMENSIONS DU CANVAS
========================================================== */

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 520;

/* ==========================================================
   OUTILS
========================================================== */

const SHAPE_TOOLS = [
  {
    id: "select",
    label: "Sélection",
    icon: MousePointer2,
  },
  {
    id: "rectangle",
    label: "Rectangle",
    icon: Square,
  },
  {
    id: "circle",
    label: "Cercle",
    icon: Circle,
  },
  {
    id: "triangle",
    label: "Triangle",
    icon: Triangle,
  },
  {
    id: "arrow",
    label: "Flèche",
    icon: ArrowRight,
  },
  {
    id: "line",
    label: "Ligne",
    icon: Minus,
  },
  {
    id: "experiment",
    label: "Expérience",
    icon: FlaskConical,
  },
  {
    id: "text",
    label: "Texte",
    icon: Type,
  },
];

/* ==========================================================
   COMPOSANT
========================================================== */

function ScientificDiagramEditor({ editor, onClose }) {
  const [activeTool, setActiveTool] = useState("select");
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const dragRef = useRef(null);

  /* ========================================================
     CRÉATION DES FORMES
  ======================================================== */

  const createElement = (type, x, y) => {
    const id = `shape-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const element = {
      id,
      type,
      x,
      y,
      width: 150,
      height: 80,
      text: "",
    };

    if (type === "circle") {
      element.width = 110;
      element.height = 110;
    }

    if (type === "triangle") {
      element.width = 140;
      element.height = 110;
    }

    if (type === "arrow") {
      element.width = 170;
      element.height = 50;
    }

    if (type === "line") {
      element.width = 180;
      element.height = 30;
    }

    if (type === "experiment") {
      element.width = 180;
      element.height = 90;
    }

    if (type === "text") {
      element.width = 220;
      element.height = 45;
      element.text = "Texte scientifique";
    }

    setElements((previous) => [
      ...previous,
      element,
    ]);

    setSelectedId(id);
    setActiveTool("select");
  };

  /* ========================================================
     CLIC SUR LE CANVAS
  ======================================================== */

  const handleCanvasClick = (event) => {
    if (activeTool === "select") {
      setSelectedId(null);
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const scaleX =
      CANVAS_WIDTH / rect.width;

    const scaleY =
      CANVAS_HEIGHT / rect.height;

    const x =
      (event.clientX - rect.left) *
      scaleX;

    const y =
      (event.clientY - rect.top) *
      scaleY;

    const selectedTool = SHAPE_TOOLS.find(
      (tool) =>
        tool.id === activeTool
    );

    if (!selectedTool) {
      return;
    }

    let width = 150;
    let height = 80;

    if (activeTool === "circle") {
      width = 110;
      height = 110;
    }

    if (activeTool === "triangle") {
      width = 140;
      height = 110;
    }

    if (activeTool === "arrow") {
      width = 170;
      height = 50;
    }

    if (activeTool === "line") {
      width = 180;
      height = 30;
    }

    if (activeTool === "experiment") {
      width = 180;
      height = 90;
    }

    if (activeTool === "text") {
      width = 220;
      height = 45;
    }

    createElement(
      activeTool,
      Math.max(
        10,
        Math.min(
          CANVAS_WIDTH - width - 10,
          x - width / 2
        )
      ),
      Math.max(
        10,
        Math.min(
          CANVAS_HEIGHT - height - 10,
          y - height / 2
        )
      )
    );
  };

  /* ========================================================
     SÉLECTION
  ======================================================== */

  const selectElement = (event, id) => {
    event.stopPropagation();

    setSelectedId(id);
    setActiveTool("select");
  };

  /* ========================================================
     DÉPLACEMENT
  ======================================================== */

  const handlePointerDown = (
    event,
    element
  ) => {
    event.stopPropagation();

    if (activeTool !== "select") {
      return;
    }

    const canvas =
      event.currentTarget.closest(
        "[data-diagram-canvas]"
      );

    if (!canvas) {
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      CANVAS_WIDTH / rect.width;

    const scaleY =
      CANVAS_HEIGHT / rect.height;

    const pointerX =
      (event.clientX - rect.left) *
      scaleX;

    const pointerY =
      (event.clientY - rect.top) *
      scaleY;

    dragRef.current = {
      id: element.id,
      offsetX:
        pointerX - element.x,
      offsetY:
        pointerY - element.y,
    };

    setSelectedId(element.id);

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) {
      return;
    }

    const canvas =
      event.currentTarget;

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      CANVAS_WIDTH / rect.width;

    const scaleY =
      CANVAS_HEIGHT / rect.height;

    const pointerX =
      (event.clientX - rect.left) *
      scaleX;

    const pointerY =
      (event.clientY - rect.top) *
      scaleY;

    const newX =
      pointerX -
      dragRef.current.offsetX;

    const newY =
      pointerY -
      dragRef.current.offsetY;

    setElements((previous) =>
      previous.map((element) => {
        if (
          element.id !==
          dragRef.current.id
        ) {
          return element;
        }

        return {
          ...element,
          x: Math.max(
            0,
            Math.min(
              CANVAS_WIDTH -
                element.width,
              newX
            )
          ),
          y: Math.max(
            0,
            Math.min(
              CANVAS_HEIGHT -
                element.height,
              newY
            )
          ),
        };
      })
    );
  };

  const stopDragging = () => {
    dragRef.current = null;
  };

  /* ========================================================
     SUPPRESSION
  ======================================================== */

  const deleteSelected = () => {
    if (!selectedId) {
      return;
    }

    setElements((previous) =>
      previous.filter(
        (element) =>
          element.id !== selectedId
      )
    );

    setSelectedId(null);
  };

  /* ========================================================
     TEXTE
  ======================================================== */

  const updateText = (id, value) => {
    setElements((previous) =>
      previous.map((element) =>
        element.id === id
          ? {
              ...element,
              text: value,
            }
          : element
      )
    );
  };

  /* ========================================================
     SVG FINAL
  ======================================================== */

  const svgMarkup = useMemo(() => {
    const svgElements = elements
      .map((element) => {
        const {
          type,
          x,
          y,
          width,
          height,
          text,
        } = element;

        /* ----------------------------------------------
           RECTANGLE
        ---------------------------------------------- */

        if (type === "rectangle") {
          return `
            <rect
              x="${x}"
              y="${y}"
              width="${width}"
              height="${height}"
              rx="8"
              fill="#ffffff"
              stroke="#334155"
              stroke-width="2"
            />
          `;
        }

        /* ----------------------------------------------
           CERCLE
        ---------------------------------------------- */

        if (type === "circle") {
          return `
            <circle
              cx="${x + width / 2}"
              cy="${y + height / 2}"
              r="${Math.min(width, height) / 2}"
              fill="#ffffff"
              stroke="#334155"
              stroke-width="2"
            />
          `;
        }

        /* ----------------------------------------------
           TRIANGLE
        ---------------------------------------------- */

        if (type === "triangle") {
          return `
            <polygon
              points="
                ${x + width / 2},${y}
                ${x + width},${y + height}
                ${x},${y + height}
              "
              fill="#ffffff"
              stroke="#334155"
              stroke-width="2"
            />
          `;
        }

        /* ----------------------------------------------
           FLÈCHE
        ---------------------------------------------- */

        if (type === "arrow") {
          return `
            <defs>
              <marker
                id="macevo-arrow-final"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M0,0 L0,6 L9,3 z"
                  fill="#334155"
                />
              </marker>
            </defs>

            <line
              x1="${x}"
              y1="${y + height / 2}"
              x2="${x + width}"
              y2="${y + height / 2}"
              stroke="#334155"
              stroke-width="2"
              marker-end="url(#macevo-arrow-final)"
            />
          `;
        }

        /* ----------------------------------------------
           LIGNE
        ---------------------------------------------- */

        if (type === "line") {
          return `
            <line
              x1="${x}"
              y1="${y + height / 2}"
              x2="${x + width}"
              y2="${y + height / 2}"
              stroke="#334155"
              stroke-width="2"
            />
          `;
        }

        /* ----------------------------------------------
           BLOC EXPÉRIMENTAL
        ---------------------------------------------- */

        if (type === "experiment") {
          return `
            <rect
              x="${x}"
              y="${y}"
              width="${width}"
              height="${height}"
              rx="10"
              fill="#ffffff"
              stroke="#334155"
              stroke-width="2"
            />
          `;
        }

        /* ----------------------------------------------
           TEXTE
        ---------------------------------------------- */

        if (type === "text") {
          const safeText = String(
            text || "Texte scientifique"
          )
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");

          return `
            <text
              x="${x}"
              y="${y + 25}"
              font-size="17"
              font-family="Arial, sans-serif"
              fill="#0f172a"
            >
              ${safeText}
            </text>
          `;
        }

        return "";
      })
      .join("");

    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${CANVAS_WIDTH}"
        height="${CANVAS_HEIGHT}"
        viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}"
      >
        <rect
          width="${CANVAS_WIDTH}"
          height="${CANVAS_HEIGHT}"
          fill="white"
        />

        ${svgElements}
      </svg>
    `;
  }, [elements]);

  /* ========================================================
     RENDU VISUEL DU CANVAS
  ======================================================== */

  const renderElement = (element) => {
    const {
      id,
      type,
      x,
      y,
      width,
      height,
      text,
    } = element;

    const selected =
      id === selectedId;

    const stroke =
      selected
        ? "#2563eb"
        : "#334155";

    const strokeWidth =
      selected ? 3 : 2;

    /* ----------------------------------------------
       RECTANGLE
    ---------------------------------------------- */

    if (type === "rectangle") {
      return (
        <rect
          key={id}
          x={x}
          y={y}
          width={width}
          height={height}
          rx="8"
          fill="white"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }

    /* ----------------------------------------------
       CERCLE
    ---------------------------------------------- */

    if (type === "circle") {
      return (
        <circle
          key={id}
          cx={x + width / 2}
          cy={y + height / 2}
          r={Math.min(width, height) / 2}
          fill="white"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }

    /* ----------------------------------------------
       TRIANGLE
    ---------------------------------------------- */

    if (type === "triangle") {
      return (
        <polygon
          key={id}
          points={`
            ${x + width / 2},${y}
            ${x + width},${y + height}
            ${x},${y + height}
          `}
          fill="white"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }

    /* ----------------------------------------------
       FLÈCHE
    ---------------------------------------------- */

    if (type === "arrow") {
      return (
        <g key={id}>
          <defs>
            <marker
              id={`arrow-${id}`}
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M0,0 L0,6 L9,3 z"
                fill={stroke}
              />
            </marker>
          </defs>

          <line
            x1={x}
            y1={y + height / 2}
            x2={x + width}
            y2={y + height / 2}
            stroke={stroke}
            strokeWidth={strokeWidth}
            markerEnd={`url(#arrow-${id})`}
          />
        </g>
      );
    }

    /* ----------------------------------------------
       LIGNE
    ---------------------------------------------- */

    if (type === "line") {
      return (
        <line
          key={id}
          x1={x}
          y1={y + height / 2}
          x2={x + width}
          y2={y + height / 2}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }

    /* ----------------------------------------------
       EXPÉRIENCE
    ---------------------------------------------- */

    if (type === "experiment") {
      return (
        <rect
          key={id}
          x={x}
          y={y}
          width={width}
          height={height}
          rx="10"
          fill="white"
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }

    /* ----------------------------------------------
       TEXTE
    ---------------------------------------------- */

    if (type === "text") {
      return (
        <text
          key={id}
          x={x}
          y={y + 25}
          fontSize="17"
          fontFamily="Arial, sans-serif"
          fill="#0f172a"
        >
          {text || "Texte scientifique"}
        </text>
      );
    }

    return null;
  };

  /* ========================================================
     INSERTION DANS TIPTAP
  ======================================================== */

  const insertDiagram = () => {
    if (
      !editor ||
      elements.length === 0
    ) {
      return;
    }

    const encodedSvg =
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        svgMarkup
      )}`;

    editor
      .chain()
      .focus()
      .setImage({
        src: encodedSvg,
        alt: "Schéma scientifique",
        title: "Schéma scientifique MACEVO",
      })
      .run();

    onClose();
  };

  /* ========================================================
     RENDU
  ======================================================== */

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-6">

      <div className="flex max-h-[92vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Constructeur de schéma scientifique
            </h2>

            <p className="text-xs text-slate-500">
              Construisez votre schéma puis insérez-le dans le document.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Fermer"
          >
            <X size={20} />
          </button>

        </div>

        {/* ==================================================
            BARRE D'OUTILS
        ================================================== */}

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">

          {SHAPE_TOOLS.map(
            (tool) => {
              const Icon =
                tool.icon;

              const active =
                activeTool ===
                tool.id;

              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() =>
                    setActiveTool(
                      tool.id
                    )
                  }
                  className={`
                    flex
                    items-center
                    gap-2
                    rounded-md
                    border
                    px-3
                    py-2
                    text-xs
                    font-medium
                    transition
                    ${
                      active
                        ? "border-blue-400 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    }
                  `}
                >
                  <Icon size={16} />
                  {tool.label}
                </button>
              );
            }
          )}

          <div className="ml-auto flex items-center gap-2">

            <button
              type="button"
              onClick={() => {
                setElements([]);
                setSelectedId(null);
              }}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <RotateCcw size={16} />
              Effacer tout
            </button>

            <button
              type="button"
              onClick={deleteSelected}
              disabled={!selectedId}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={16} />
              Supprimer
            </button>

          </div>

        </div>

        {/* ==================================================
            CANVAS
        ================================================== */}

        <div className="flex min-h-0 flex-1 overflow-auto bg-slate-100 p-6">

          <div className="mx-auto w-full max-w-[900px]">

            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">

              <span>
                Outil :{" "}
                <strong className="text-slate-700">
                  {
                    SHAPE_TOOLS.find(
                      (tool) =>
                        tool.id ===
                        activeTool
                    )?.label
                  }
                </strong>
              </span>

              <span>
                {elements.length} élément
                {elements.length >
                1
                  ? "s"
                  : ""}
              </span>

            </div>

            <div
              data-diagram-canvas
              className={`
                relative
                w-full
                overflow-hidden
                rounded-lg
                border
                border-slate-300
                bg-white
                shadow-sm
                ${
                  activeTool !==
                  "select"
                    ? "cursor-crosshair"
                    : "cursor-default"
                }
              `}
              style={{
                aspectRatio:
                  `${CANVAS_WIDTH}/${CANVAS_HEIGHT}`,
              }}
              onClick={
                handleCanvasClick
              }
              onPointerMove={
                handlePointerMove
              }
              onPointerUp={
                stopDragging
              }
              onPointerLeave={
                stopDragging
              }
            >

              <svg
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                className="h-full w-full"
                xmlns="http://www.w3.org/2000/svg"
              >

                {/* ================================
                    GRILLE
                ================================= */}

                <defs>
                  <pattern
                    id="scientific-grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>

                <rect
                  width={
                    CANVAS_WIDTH
                  }
                  height={
                    CANVAS_HEIGHT
                  }
                  fill="url(#scientific-grid)"
                />

                {/* ================================
                    FORMES
                ================================= */}

                {elements.map(
                  (element) => (
                    <g
                      key={
                        element.id
                      }
                      onClick={(event) =>
                        selectElement(
                          event,
                          element.id
                        )
                      }
                      onPointerDown={(
                        event
                      ) =>
                        handlePointerDown(
                          event,
                          element
                        )
                      }
                    >
                      {renderElement(
                        element
                      )}

                      {/* Sélection */}
                      {element.id ===
                        selectedId && (
                        <rect
                          x={
                            element.x -
                            6
                          }
                          y={
                            element.y -
                            6
                          }
                          width={
                            element.width +
                            12
                          }
                          height={
                            element.height +
                            12
                          }
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="1.5"
                          strokeDasharray="5 4"
                          pointerEvents="none"
                        />
                      )}
                    </g>
                  )
                )}

              </svg>

            </div>

            {/* ==================================================
                ÉDITION DU TEXTE
            ================================================== */}

            {selectedId &&
              elements.find(
                (element) =>
                  element.id ===
                    selectedId &&
                  element.type ===
                    "text"
              ) && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">

                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Texte
                  </label>

                  <input
                    type="text"
                    value={
                      elements.find(
                        (element) =>
                          element.id ===
                          selectedId
                      )?.text || ""
                    }
                    onChange={(event) =>
                      updateText(
                        selectedId,
                        event.target.value
                      )
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Écrire un texte..."
                  />

                </div>
              )}

          </div>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">

          <p className="text-xs text-slate-500">
            Sélectionnez une forme pour la déplacer.
          </p>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={
                insertDiagram
              }
              disabled={
                elements.length === 0
              }
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={17} />
              Insérer dans le document
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ScientificDiagramEditor;