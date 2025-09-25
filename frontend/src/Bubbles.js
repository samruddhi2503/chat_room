// Bubbles.js
import React, { useEffect, useState } from "react";
import "./App.css"; // reuses bubble styles

const Bubbles = ({ count = 75 }) => {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    // generate random bubbles
    const b = Array.from({ length: count }, () => ({
      top: Math.random() * 100 + "%",          // random vertical position
      size: Math.random() * 30 + 10 + "px",    // random size
      duration: Math.random() * 15 + 10 + "s", // random animation duration
      delay: Math.random() * 5 + "s",          // random animation delay
    }));
    setBubbles(b);
  }, [count]);

  return (
    <>
      {bubbles.map((b, idx) => (
        <div
          key={idx}
          className="bubble"
          style={{
            top: b.top,
            width: b.size,
            height: b.size,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        />
      ))}
    </>
  );
};

export default Bubbles;
