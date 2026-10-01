"use client";

import { useEffect, useRef, useState } from "react";
import { sampleDocs, type Doc } from "@/lib/sampleDocs";

type Citation = { docTitle: string; heading: string; quote: string };
type Hit = { docTitle: string; heading: string; score: number };
type Message = { role: "user" | "assistant"; text: string; citations?: Citation[]; error?: boolean };

const SUGGESTIONS = [
  "Can I deploy on a Friday?",
  "How do I help a client who is locked out?",
  "How long are backups kept?",
  "What happens if a release breaks the site?",
];

const passageCount = (docs: Doc[]) => docs.reduce((n, d) => n + d.text.split(/\n\s*\n/).filter((b) => b.trim() && !/^#+\s[^\n]*$/.test(b.trim())).length, 0);

export function DocsChat() {
  const [docs, setDocs] = useState<Doc[]>(sampleDocs);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hits, setHits] = useState<Hit[]>([]);
  const [lastQuery, setLastQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [openCite, setOpenCite] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  // ?q=... asks a question straight away (useful for portfolio links).
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return; // React runs effects twice in development
    autoRan.current = true;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) ask(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const added: Doc[] = [];
    for (const f of Array.from(files)) {
      if (!/\.(txt|md|markdown)$/i.test(f.name)) continue;
      added.push({ id: `${f.name}-${f.lastModified}`, title: f.name.replace(/\.(txt|md|markdown)$/i, ""), text: await f.text() });
    }
    setDocs((d) => [...d, ...added]);
  }

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setQuestion("");
    setLastQuery(q);
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q, docs }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHits(data.retrieved || []);
      setMessages((m) => [...m, { role: "assistant", text: data.answer, citations: data.citations }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: e instanceof Error && e.message ? e.message : "Something went wrong.", error: true }]);
    } finally {
      setLoading(false);
    }
  }

  const top = hits[0]?.score || 1;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px 32px" }}>
      <div className="console" style={{ maxWidth: "none", padding: 0 }}>
        <aside className="pane">
          <div className="pane-head"><span>index</span><b>{docs.length} files / {passageCount(docs)} passages</b></div>
          <ul className="files">
            {docs.map((d) => (
              <li key={d.id} className="file">
                <span className="file-glyph" aria-hidden="true">{d.sample ? "▤" : "▣"}</span>
                <span className="file-name" title={d.title}>{d.title.toLowerCase().replace(/\s+/g, "-")}.md</span>
                <button className="file-x" aria-label={`Remove ${d.title}`} onClick={() => setDocs((all) => all.filter((x) => x.id !== d.id))}>×</button>
              </li>
            ))}
          </ul>
          <input ref={fileInput} type="file" accept=".txt,.md,.markdown" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          <div className="lib-actions">
            <button className="btn" onClick={() => fileInput.current?.click()}>+ add .md / .txt</button>
            {docs.length !== sampleDocs.length && <button className="btn" onClick={() => setDocs(sampleDocs)}>reset samples</button>}
          </div>
          <p className="lib-note">files stay in your browser. only matching passages are sent to the model.</p>
        </aside>

        <section className="pane term">
          <div className="pane-head"><span>session</span><b>{(() => { const n = messages.filter((m) => m.role === "user").length; return `${n} ${n === 1 ? "query" : "queries"}`; })()}</b></div>
          <div className="log" ref={log} aria-live="polite">
            {messages.length === 0 && (
              <div className="empty">
                <h2>Ask a question</h2>
                <p>Try one of these against the sample handbook.</p>
                <div className="prompts">
                  {SUGGESTIONS.map((s) => <button key={s} className="prompt-btn" onClick={() => ask(s)}><span>&gt;</span>{s}</button>)}
                </div>
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <p key={i} className="q">{m.text}</p>
              ) : (
                <div key={i} className={`a${m.error ? " is-error" : ""}`}>
                  <p>{m.text}</p>
                  {!!m.citations?.length && (
                    <>
                      <div className="cites">
                        {m.citations.map((c, ci) => {
                          const key = `${i}-${ci}`;
                          return (
                            <button key={key} className="cite" aria-expanded={openCite === key} onClick={() => setOpenCite(openCite === key ? null : key)}>
                              <b>[{ci + 1}]</b>{c.docTitle} / {c.heading}
                            </button>
                          );
                        })}
                      </div>
                      {m.citations.map((c, ci) => openCite === `${i}-${ci}` && <blockquote key={ci} className="quote">{c.quote}</blockquote>)}
                    </>
                  )}
                </div>
              ),
            )}
            {loading && <p className="thinking">retrieving passages and answering</p>}
          </div>
          <form className="input" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
            <label htmlFor="q">&gt;</label>
            <input id="q" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="ask about your docs..." autoComplete="off" />
            <button className="btn btn-lime" disabled={loading || !question.trim()}>run</button>
          </form>
        </section>

        <aside className="pane pane-trace">
          <div className="pane-head"><span>retrieval trace</span><b>top {hits.length || 5}</b></div>
          <div className="trace">
            {!hits.length && <p className="trace-empty">Run a query to see which passages were retrieved and how strongly each one matched.</p>}
            {hits.map((h, i) => (
              <div key={i} className="hit">
                <div className="hit-top"><b>{h.docTitle} / {h.heading}</b><span>{h.score.toFixed(2)}</span></div>
                <div className="hit-bar"><span style={{ width: `${Math.max(6, (h.score / top) * 100)}%` }} /></div>
              </div>
            ))}
            {!!hits.length && (
              <p className="trace-foot">
                query <b>&quot;{lastQuery}&quot;</b><br />
                ranker <b>bm25 (k1 1.2, b 0.75)</b><br />
                sent to model <b>{hits.length} passages</b>
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
