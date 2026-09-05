/**
 * OutlinePanelPlugin - Lexical plugin that tracks heading nodes in real-time
 *
 * Listens for editor updates and extracts heading hierarchy for the outline panel.
 */

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isHeadingNode } from '@lexical/rich-text';
import type { LexicalEditor } from 'lexical';

export interface OutlineHeading {
  key: string;
  text: string;
  level: number;
}

function areHeadingsEqual(a: OutlineHeading[], b: OutlineHeading[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].key !== b[i].key || a[i].text !== b[i].text || a[i].level !== b[i].level) {
      return false;
    }
  }
  return true;
}

function collectHeadings(editor: LexicalEditor): OutlineHeading[] {
  const entries: OutlineHeading[] = [];
  const state = editor.getEditorState();
  state.read(() => {
    const nodeMap = state._nodeMap;
    nodeMap.forEach((node) => {
      if ($isHeadingNode(node)) {
        const tag = node.getTag();
        const level = parseInt(tag.replace('h', ''), 10);
        const text = node.getTextContent();
        if (text.trim()) {
          entries.push({ key: node.getKey(), text, level });
        }
      }
    });
  });
  return entries;
}

export function scrollToHeading(editor: LexicalEditor, headingKey: string): void {
  const element = editor.getElementByKey(headingKey);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

interface OutlinePanelPluginProps {
  onHeadingsChange: (headings: OutlineHeading[]) => void;
}

export default function OutlinePanelPlugin({ onHeadingsChange }: OutlinePanelPluginProps) {
  const [editor] = useLexicalComposerContext();
  const lastHeadingsRef = useRef<OutlineHeading[]>([]);
  const onHeadingsChangeRef = useRef(onHeadingsChange);

  useEffect(() => {
    onHeadingsChangeRef.current = onHeadingsChange;
  }, [onHeadingsChange]);

  useEffect(() => {
    const syncHeadings = () => {
      const newHeadings = collectHeadings(editor);
      if (!areHeadingsEqual(newHeadings, lastHeadingsRef.current)) {
        lastHeadingsRef.current = newHeadings;
        onHeadingsChangeRef.current(newHeadings);
      }
    };

    // Initial collection
    syncHeadings();

    // Listen for updates
    const unregister = editor.registerUpdateListener(() => {
      syncHeadings();
    });

    return unregister;
  }, [editor]);

  return null;
}
