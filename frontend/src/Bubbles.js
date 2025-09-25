
import React, { useEffect, useState } from "react";
import "./App.css"; 
const Bubbles = ({ count = 75 }) => {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {

    const b = Array.from({ length: count }, () => ({
      top: Math.random() * 100 + "%",          
      size: Math.random() * 30 + 10 + "px",    
      duration: Math.random() * 15 + 10 + "s", 
      delay: Math.random() * 5 + "s",          
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
