import { useEffect, useRef, useState } from "react";
import { fromEvent, map, mergeAll, Subscription, takeUntil } from "rxjs";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [restart, setRestart] = useState(false);

  const startBoard = () => {
    const canvasEl = canvasRef.current as HTMLCanvasElement;

    const canvasContext = canvasEl.getContext("2d") as CanvasRenderingContext2D;

    // reset del canvas, cleaning
    const cursorPosition = { x: 0, y: 0 };
    canvasContext.clearRect(0, 0, canvasEl.width, canvasEl.height);

    // setting de como sera la linea
    canvasContext.lineWidth = 8;
    canvasContext.lineJoin = "round";
    canvasContext.lineCap = "round";
    canvasContext.strokeStyle = "white";

    // cuando presiona click al mouse
    const onMouseDown$ = fromEvent<MouseEvent>(canvasEl, "mousedown");

    // entonces la primera vez que mantiene debe actualizar
    // el punto donde lo hizo
    const updateCursorPosition = (event: MouseEvent) => {
      console.log("down", {
        clientX: event.clientX,
        clientY: event.clientY,
      });
      cursorPosition.x = event.clientX - canvasEl.offsetLeft;
      cursorPosition.y = event.clientY - canvasEl.offsetTop;
    };
    const mouseDownSubcription = onMouseDown$.subscribe(updateCursorPosition);

    // cuando suelta, deja de presionar el click del mouse
    const onMouseUp$ = fromEvent(canvasEl, "mouseup");

    // mientras mueve
    const onMouseMove$ = fromEvent<MouseEvent>(canvasEl, "mousemove").pipe(
      // que deje de emotir asi deja de soltar
      takeUntil(onMouseUp$)
    );

    const paintWhiteboard$ = onMouseDown$.pipe(
      // por cada pulsacion retornare un observable onMouseMove$
      map(() => onMouseMove$),

      // uno esos observables en uno solo
      // si no hago esto entonces la suscricion tendria que hacer lo siguiente
      // paintWhiteboard$.subscribe(value=>{
      //   value.subcribe(console.log)
      //  });
      mergeAll()
    );


    const paintStroke = (event: MouseEvent) => {
      canvasContext.beginPath();
      canvasContext.moveTo(cursorPosition.x, cursorPosition.y);
      updateCursorPosition(event);
      canvasContext.lineTo(cursorPosition.x, cursorPosition.y);
      canvasContext.stroke();
      canvasContext.closePath();
    };

    const paintSubcription = paintWhiteboard$.subscribe(paintStroke);

    return { mouseDownSubcription, paintSubcription };
  };

  useEffect(() => {
    const { mouseDownSubcription, paintSubcription } = startBoard();
    return () => {
      mouseDownSubcription.unsubscribe();
      paintSubcription.unsubscribe();
    };
  }, [restart]);

  return (
    <div className="board-app">
      <h1 className="board__title">Board App</h1>
      <canvas ref={canvasRef} className="board" height={500} width={900} />
      <button
        className="board__action"
        onClick={() => {
          setRestart(!restart);
        }}
      >
        Restart
      </button>
    </div>
  );
}

export default App;
