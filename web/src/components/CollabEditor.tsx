"use client";
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

type Props = {
  fileId: string; token: string; user: { name: string }; language: string; readOnly: boolean;
  onReady: (h: { getValue: () => string; restore: (t: string) => void }) => void;
  onStatus: (s: string) => void; onPeers: (n: number) => void;
};

export default function CollabEditor({ fileId, token, user, language, readOnly, onReady, onStatus, onPeers }: Props) {
  const [editor, setEditor] = useState<any>(null);
  const cb = useRef({ onReady, onStatus, onPeers });
  cb.current = { onReady, onStatus, onPeers };

  useEffect(() => {
    if (!editor) return;
    let dead = false;
    const ydoc = new Y.Doc();
    const provider = new HocuspocusProvider({ url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4001", name: `file:${fileId}`, token, document: ydoc });
    const yText = ydoc.getText("content");
    let binding: any;
    provider.setAwarenessField("user", { name: user.name, color: "#ffa500" });
    provider.on("status", ({ status }: any) => cb.current.onStatus(status === "connected" ? "Connected" : status === "connecting" ? "Reconnecting" : "Offline"));
    const aw = provider.awareness as any;
    const upd = () => cb.current.onPeers(aw.getStates().size);
    aw?.on("change", upd);
    import("y-monaco").then(({ MonacoBinding }) => {
      if (dead) return;
      binding = new MonacoBinding(yText, editor.getModel(), new Set([editor]), provider.awareness as any);
      cb.current.onReady({
        getValue: () => editor.getValue(),
        restore: (t: string) => ydoc.transact(() => { yText.delete(0, yText.length); yText.insert(0, t); }),
      });
    });
    return () => { dead = true; aw?.off("change", upd); binding?.destroy(); provider.destroy(); ydoc.destroy(); };
  }, [editor, fileId, token, user.name]);

  return (
    <Editor key={fileId} height="100%" theme="vs-dark" language={language} options={{ readOnly, minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
      onMount={(e) => setEditor(e)} />
  );
}
