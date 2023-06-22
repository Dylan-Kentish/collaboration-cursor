"use client";

import { useEffect, useRef, useState } from "react";
import { env } from "@/env.mjs";

type Message = {
  sender: string;
  x: number;
  y: number;
  color: number;
};

type CursorProps = {
  sender?: string;
  fill?: string;
  x?: number;
  y?: number;
};

const Cursor: React.FC<CursorProps> = ({ fill, x, y }) => (
  <svg
    className="absolute"
    width="50px"
    height="50px"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: `translate(${x}px, ${y}px)` }}
  >
    <path
      d="M8.68602 16.288L8.10556 9.37387C7.96399 7.68752 9.85032 6.59846 11.24 7.56424L16.9375 11.524C18.6256 12.6972 17.6579 15.348 15.611 15.1577L14.8273 15.0849C13.9821 15.0063 13.1795 15.4697 12.825 16.2409L12.4962 16.9561C11.6376 18.8238 8.858 18.3365 8.68602 16.288Z"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function throttle<T>(callback: (e: T) => void, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return (e: T) => {
    if (timeout) return;
    timeout = setTimeout(() => (callback(e), (timeout = null)), wait);
  };
}

export default function Home() {
  const id = useRef(Math.random().toString(36).slice(2, 9));
  const color = useRef(Math.floor(Math.random() * 360));
  const ws = useRef<WebSocket | null>(null);

  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; color: number }>>(
    {}
  );

  function send(message: Message) {
    if (!ws.current) return;
    if (ws.current.readyState === ws.current.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }

  function handleClick() {
    color.current = Math.floor(Math.random() * 360);

    const cursor = cursors[id.current];

    send({
      sender: id.current,
      x: cursor.x,
      y: cursor.y,
      color: color.current,
    });

    setCursors(current => {
      current[id.current] = {
        x: cursor.x,
        y: cursor.y,
        color: color.current,
      };

      return { ...current };
    });
  }

  useEffect(() => {
    ws.current = new WebSocket(env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL);
    ws.current.onopen = () => console.log("ws opened");
    ws.current.onclose = () => console.log("ws closed");

    const wsCurrent = ws.current;

    return () => {
      wsCurrent.close();
    };
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent<string>) {
      const message = JSON.parse(event.data) as Message;

      setCursors(current => {
        current[message.sender] = {
          x: message.x,
          y: message.y,
          color: message.color,
        };

        return { ...current };
      });
    }

    if (!ws.current) return;

    const localWS = ws.current;

    localWS.addEventListener("message", handleMessage);

    return () => {
      localWS.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      send({
        sender: id.current,
        x: event.clientX,
        y: event.clientY,
        color: color.current,
      });

      setCursors(current => {
        current[id.current] = {
          x: event.clientX,
          y: event.clientY,
          color: color.current,
        };

        return { ...current };
      });
    }

    document.addEventListener("mousemove", throttle(handleMouseMove, 20));

    return () => {
      document.removeEventListener("mousemove", throttle(handleMouseMove, 20));
    };
  }, [id, color]);

  return (
    <div className="flex grow h-full" onClick={handleClick}>
      <ul>
        {Object.entries(cursors).map(([sender, { x, y, color }]) => (
          <Cursor key={sender} fill={`hsl(${color}, 100%, 50%)`} x={x} y={y} />
        ))}
      </ul>
    </div>
  );
}
