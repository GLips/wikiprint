import Image from "next/image";
import { ReactNode } from "react";
import WikipediaUrlForm from "@/components/wikipedia-url-form";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center print:mx-[24mm]">
      <div className="px-4 mb-8 w-full max-w-2xl prose">
        <div className="pt-16 pb-12 md:pt-24">
          <h1 className="my-2 font-serif !leading-[1.1em] tracking-tight text-center">
            Get a beautiful, printer friendly version of any Wikipedia article
          </h1>
          <div className="font-serif text-xl md:text-2xl !mt-0 text-center">(for free)</div>
        </div>

        <div className="px-6 py-6 mb-16 space-y-4 rounded-lg shadow-inner md:mb-24 bg-sky-200/30">
          {/* <h2 className="!my-0 text-center">Enter a Wikipedia article below</h2> */}
          <div className="flex flex-col w-full not-prose">
            <div className="flex justify-center">
              <WikipediaUrlForm slug={"French_cuisine"} noArticle />
            </div>
          </div>
        </div>
      </div>
      <div className="flex relative flex-col items-center w-full bg-slate-900 test">
        <div className="glow" />
        <div className="px-4 py-48 space-y-12 w-full max-w-7xl md:space-y-24">
          <div className="mb-48 font-serif text-5xl text-slate-300">You have questions...</div>
          <div className="test">
            <FAQ question="Why do I need a special site to print Wikipedia articles?">
              <p>
                Honestly, I don't know, but Wikipedia articles are hideous when printed. A
                convoluted jumble of text, tables, images, and references. A great ink cartridge
                endurance test, but that's about it.
              </p>
              <p>See for yourself.</p>
            </FAQ>
            <div className="grid grid-cols-1 gap-4 justify-center items-center pt-24 lg:grid-cols-7">
              <Image
                alt="A printed Wikipedia page. Eww!"
                title="A printed Wikipedia page. Eww!"
                src="/wikipedia-preview.png"
                className="col-span-3 mx-auto"
                width={1040 / 2}
                height={1345 / 2}
              />
              <div className="text-3xl text-center text-slate-300">vs.</div>
              <Image
                alt="A printed Wikiprint page. Lovely."
                title="A printed Wikiprint page. Lovely."
                src="/wikiprint-preview.png"
                className="col-span-3 mx-auto"
                width={1040 / 2}
                height={1345 / 2}
              />
            </div>
            <div className="flex gap-4 justify-center items-center my-16 lg:my-32">
              <span className="font-sans text-3xl text-slate-300">and</span>
            </div>
            <div className="grid grid-cols-1 gap-4 justify-center items-center lg:grid-cols-7">
              <Image
                alt="Wikipedia generally includes many pages full of footnotes and references."
                src="/wikipedia-references.png"
                className="col-span-3 mx-auto"
                width={1040 / 2}
                height={1345 / 2}
              />
              <div className="text-3xl text-center text-slate-300">vs.</div>
              <div className="w-full mx-auto text-slate-900 bg-white flex items-center justify-center max-w-[520px] text-center col-span-3 h-[360px] sm:h-[670px] px-4">
                (nothing... why would you want to print that)
              </div>
            </div>
          </div>
          <FAQ question="I have an idea for a feature!">
            <p>That's not a question, but I appreciate the enthusiasm!</p>
            <p>
              Wikiprint is an open source project, and{" "}
              <a
                href="https://github.com/GLips/wikiprint"
                target="_blank"
                rel="noopener noreferrer"
                className="font-light text-white underline-offset-2 after:!hidden"
              >
                contributions are welcomed
              </a>
              . If you're not so technically inclined, you can{" "}
              <a
                href="https://github.com/GLips/wikiprint/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="font-light text-white underline-offset-2 after:!hidden"
              >
                file a bug report or make a request as well
              </a>
              .
            </p>
          </FAQ>
          <FAQ question="Who built this incredible resource?">
            <p>
              <a
                href="https://twitter.com/glipsman"
                target="_blank"
                rel="noopener noreferrer"
                className="font-light text-white underline-offset-2 after:!hidden"
              >
                Me
              </a>
              !
            </p>
          </FAQ>
        </div>
      </div>
      <svg aria-hidden="true" className="hidden">
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="6.29"
            numOctaves="6"
            stitchTiles="stitch"
          ></feTurbulence>
        </filter>
      </svg>
    </main>
  );
}

type FAQProps = {
  question: string;
  children: ReactNode;
};
function FAQ({ question, children }: FAQProps) {
  return (
    <div className="flex relative flex-col w-full max-w-prose">
      <h2 className="mb-4 mt-0 font-serif !text-2xl text-slate-300">{question}</h2>
      <div className="prose text-slate-200">{children}</div>
    </div>
  );
}
