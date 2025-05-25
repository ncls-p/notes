import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

interface MermaidProps {
  code: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        containerRef.current.innerHTML = code;
        mermaid.run({ nodes: [containerRef.current] });
      } catch (error) {
        console.error('Error rendering Mermaid diagram:', error);
      }
    }
  }, [code]);

  return <div ref={containerRef} className="mermaid-diagram my-4" />;
};