import React from 'react';

export default function PastDayLog({ log }) {
  if (!log) return null;

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
      {log.mood && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{log.mood}</span>
          <span className="text-sm text-muted-foreground">그날의 기분</span>
        </div>
      )}
      {log.diary && (
        <p className="text-sm text-foreground/80 leading-relaxed">{log.diary}</p>
      )}
      {log.summary && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">AI 요약</p>
          <p className="text-sm text-foreground/70">{log.summary}</p>
        </div>
      )}
    </div>
  );
}