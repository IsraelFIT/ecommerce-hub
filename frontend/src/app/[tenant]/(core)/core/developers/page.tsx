"use client";

import { useState } from "react";
import { Copy, Check, Key, Terminal, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CoreDevelopersPage() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedDb, setCopiedDb] = useState(false);

  const masterApiKey = "ech_live_9f838291048a8d7162bc8392019482";
  const neonConnString =
    "postgresql+asyncpg://neondb_owner:***@ep-red-silence-b1x919l7-pooler.c-5.eu-central-1.aws.neon.tech/neondb?ssl=require";

  const copyToClipboard = (text: string, type: "key" | "db") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedDb(true);
      setTimeout(() => setCopiedDb(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex flex-col gap-5 w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
            Developers & Platform APIs
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Super Administrator API credentials, Neon async database URIs, and
            webhook endpoints
          </p>
        </div>

        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/30 text-xs px-2.5 py-1"
        >
          FastAPI Backend v1.0 • asyncpg
        </Badge>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Master API Key */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Key className="size-4 text-primary" />
              <h3 className="text-sm font-bold font-secondary text-foreground">
                Super Admin Master API Key
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-semibold">
              Live Key
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Use this key in the <code>Authorization: Bearer</code> header for
            backend operations.
          </p>

          <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-card-gray/80 dark:bg-white/5 border border-border">
            <code className="font-mono text-xs text-foreground flex-1 truncate">
              {masterApiKey}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(masterApiKey, "key")}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Copy API Key"
            >
              {copiedKey ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Neon Database URI */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-purple-500" />
              <h3 className="text-sm font-bold font-secondary text-foreground">
                Neon Staging Database URI
              </h3>
            </div>
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded font-semibold">
              Staging Pooler
            </span>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Configured in <code>backend/.env</code> for high concurrency
            connection pooling.
          </p>

          <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-card-gray/80 dark:bg-white/5 border border-border">
            <code className="font-mono text-[11px] text-foreground flex-1 truncate">
              {neonConnString}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(neonConnString, "db")}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Copy Database URL"
            >
              {copiedDb ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Code Quickstart snippet */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-primary" />
            <h3 className="text-sm font-bold font-secondary text-foreground">
              API Quickstart (cURL Example)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            FastAPI Auth & Tenant Routing
          </span>
        </div>

        <div className="mt-3 p-3 rounded-lg bg-black/80 dark:bg-black text-white font-mono text-xs overflow-x-auto">
          <pre className="text-emerald-400"># Authenticate as Super Admin</pre>
          <pre className="text-zinc-300">
            {`curl -X POST "http://localhost:8000/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "israelfolaranmi01@gmail.com",
    "password": "Pa$$w0rd!"
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
