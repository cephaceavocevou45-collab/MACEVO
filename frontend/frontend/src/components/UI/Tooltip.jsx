import {
  useState,
  useRef,
  useEffect,
  cloneElement,
} from "react";

export default function Tooltip({

  children,

  text,

  delay = 300,

}) {

  const [visible, setVisible] = useState(false);

  const [position, setPosition] = useState("top");

  const timer = useRef(null);

  const triggerRef = useRef(null);

  const tooltipRef = useRef(null);

  const show = () => {

    timer.current = setTimeout(() => {

      setVisible(true);

    }, delay);

  };

  const hide = () => {

    clearTimeout(timer.current);

    setVisible(false);

  };

  useEffect(() => {

    if (!visible) return;

    const trigger = triggerRef.current;

    const tooltip = tooltipRef.current;

    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();

    const tooltipRect = tooltip.getBoundingClientRect();

    let newPosition = "top";

    if (triggerRect.top < tooltipRect.height + 20) {

      newPosition = "bottom";

    }

    if (
      triggerRect.right + tooltipRect.width / 2 >
      window.innerWidth
    ) {

      newPosition = "left";

    }

    if (
      triggerRect.left - tooltipRect.width / 2 < 0
    ) {

      newPosition = "right";

    }

    setPosition(newPosition);

  }, [visible]);

  useEffect(() => {

    return () => clearTimeout(timer.current);

  }, []);

  const styles = {

    top: {

      container:
        "bottom-full left-1/2 -translate-x-1/2 mb-3",

      arrow:
        "top-full left-1/2 -translate-x-1/2 border-t-gray-900",

    },

    bottom: {

      container:
        "top-full left-1/2 -translate-x-1/2 mt-3",

      arrow:
        "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900",

    },

    left: {

      container:
        "right-full top-1/2 -translate-y-1/2 mr-3",

      arrow:
        "left-full top-1/2 -translate-y-1/2 border-l-gray-900",

    },

    right: {

      container:
        "left-full top-1/2 -translate-y-1/2 ml-3",

      arrow:
        "right-full top-1/2 -translate-y-1/2 border-r-gray-900",

    },

  };

  return (

    <div className="relative inline-flex">

      {cloneElement(children, {

        ref: triggerRef,

        onMouseEnter: show,

        onMouseLeave: hide,

      })}

      {visible && (

        <div

          ref={tooltipRef}

          className={`
            absolute
            z-50
            transition-all
            duration-200
            animate-in
            fade-in
            zoom-in-95
            ${styles[position].container}
          `}

        >

          <div className="relative bg-gray-900 text-white text-xs rounded-lg shadow-xl px-3 py-2 whitespace-nowrap">

            {text}

            <span

              className={`
                absolute
                w-0
                h-0
                border-4
                border-transparent
                ${styles[position].arrow}
              `}

            />

          </div>

        </div>

      )}

    </div>

  );

}