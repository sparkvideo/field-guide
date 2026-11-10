"use client";
// Two private pages. Everything typed here stays on this phone (localStorage). Nothing is sent anywhere.

import { useEffect, useState } from "react";

const load = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export function Testimony() {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setText(load("fg-testimony", ""));
    setReady(true);
  }, []);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <>
      <p className="muted mt-2">
        Three parts: my life before Christ, how I came to Him, and what has changed. About a minute out loud is 130 to 150 words.
      </p>
      <textarea
        className="field mt-5"
        rows={14}
        aria-label="My testimony"
        placeholder="Write it here. It saves as you type."
        value={text}
        disabled={!ready}
        onChange={(e) => {
          setText(e.target.value);
          save("fg-testimony", e.target.value);
        }}
      />
      <p className="muted small mt-2" aria-live="polite">
        {words} words · saved on this phone only
      </p>
    </>
  );
}

type Note = { id: string; who: string; leftOff: string; pray: string; date: string };

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);
  useEffect(() => setNotes(load<Note[]>("fg-notes", [])), []);

  const store = (next: Note[]) => {
    setNotes(next);
    save("fg-notes", next);
  };
  const blank = (): Note => ({ id: String(Date.now()), who: "", leftOff: "", pray: "", date: new Date().toLocaleDateString() });
  const keep = () => {
    if (!editing) return;
    if (editing.who.trim() || editing.leftOff.trim() || editing.pray.trim()) {
      store(notes.some((n) => n.id === editing.id) ? notes.map((n) => (n.id === editing.id ? editing : n)) : [editing, ...notes]);
    }
    setEditing(null);
  };

  if (editing) {
    const set = (k: keyof Note) => (e: { target: { value: string } }) => setEditing({ ...editing, [k]: e.target.value });
    return (
      <div className="mt-4">
        <label className="label block" htmlFor="who">
          Who
        </label>
        <input id="who" className="field" value={editing.who} onChange={set("who")} placeholder="Name, or how you'd remember them" />
        <label className="label mt-5 block" htmlFor="left" style={{ marginTop: 20 }}>
          Where we left off
        </label>
        <textarea id="left" className="field" rows={4} value={editing.leftOff} onChange={set("leftOff")} />
        <label className="label block" htmlFor="pray" style={{ marginTop: 20 }}>
          Pray for
        </label>
        <textarea id="pray" className="field" rows={3} value={editing.pray} onChange={set("pray")} />
        <div className="mt-6 grid grid-cols-2 gap-3">
          {notes.some((n) => n.id === editing.id) ? (
            <button
              className="btn"
              onClick={() => {
                store(notes.filter((n) => n.id !== editing.id));
                setEditing(null);
              }}
            >
              Delete
            </button>
          ) : (
            <button className="btn" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
          <button className="btn primary" onClick={keep}>
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button className="btn primary mt-5 w-full" onClick={() => setEditing(blank())}>
        Add a conversation
      </button>
      {notes.length === 0 ? (
        <p className="muted mt-6">No notes yet. After a conversation, jot down who it was, where you left off, and how to pray for them.</p>
      ) : (
        <div className="rows mt-6">
          {notes.map((n) => (
            <button key={n.id} className="row" onClick={() => setEditing(n)}>
              <span>
                <span className="block font-semibold">{n.who || "Unnamed"}</span>
                <span className="sub">
                  {n.date}
                  {n.leftOff ? `: ${n.leftOff.slice(0, 60)}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="muted small mt-4">Saved on this phone only.</p>
    </>
  );
}
