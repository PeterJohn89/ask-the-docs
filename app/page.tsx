import { isDemo, model } from "@/lib/claude";
import { DocsChat } from "@/components/DocsChat";

export default function Home() {
  return (
    <>
      <header className="bar">
        <a className="bar-name" href="/"><b>~/</b>ask-the-docs<span className="caret" aria-hidden="true" /></a>
        <div className="bar-meta">
          <span>retrieval <b>bm25</b></span>
          <span>model <b>{isDemo ? "demo" : model}</b></span>
          <a href="https://github.com/PeterJohn89" target="_blank" rel="noreferrer">github</a>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="intro-kicker">RAG / GROUNDED ANSWERS / CITED SOURCES</p>
          <h1>Ask your team docs anything. <span>Get answers you can check.</span></h1>
          <p>Load handbooks and SOPs, ask in plain English. Passages are ranked locally, Claude answers from them only, and every answer links back to its source.</p>
        </div>
        {isDemo && <p className="demo-flag"><b>●</b> demo mode: sample answers, real retrieval</p>}
      </section>

      <DocsChat />

      <footer className="foot">
        <span>built by peter goodwin / next.js + claude api</span>
        <a href="https://goodwinstudios.com.au" target="_blank" rel="noreferrer">goodwinstudios.com.au</a>
      </footer>
    </>
  );
}
