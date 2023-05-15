import React from "react";

export default function About() {
  return (
    <main className="relative flex flex-col items-center justify-between print:mx-[24mm]">
      <div className="w-full max-w-2xl px-4 mb-8 prose">
        <h1>About Wikiprint</h1>
        <p>
          Wikiprint is a tiny project made by Graham Lipsman (
          <a href="https://twitter.com/glipsman" target="_blank" rel="noopener noreferrer">
            @glipsman
          </a>
          )
        </p>
        <p>
          The code is open source and available{" "}
          <a href="https://github.com/GLips/wikiprint" target="_blank" rel="noopener noreferrer">
            on Github
          </a>
          .
        </p>
      </div>
    </main>
  );
}
