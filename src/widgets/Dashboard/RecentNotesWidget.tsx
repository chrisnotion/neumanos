/**
 * Recent Notes Widget
 *
 * Shows 5 most recently updated notes
 */

import React from 'react';
import { BaseWidget } from './BaseWidget';
import { useNotesStore } from '../../stores/useNotesStore';
import { useNavigate } from 'react-router-dom';
import { WidgetEmptyState } from '../../components/WidgetEmptyState';

export const RecentNotesWidget: React.FC = () => {
  const notes = useNotesStore((state) => state.notes);
  const navigate = useNavigate();

  const recentNotes = Object.values(notes)
    .sort((a, b) => {
      const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : new Date(a.updatedAt).getTime();
      const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : new Date(b.updatedAt).getTime();
      return bTime - aTime;
    })
    .slice(0, 5);

  return (
    <BaseWidget title="近期笔记" icon="📝" subtitle="最近编辑的 5 篇">
      <div className="flex flex-col h-full min-h-[160px]">
        {recentNotes.length > 0 ? (
          <div className="space-y-2 mb-4">
            {recentNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => navigate('/notes')}
                className="w-full text-left p-2 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-all duration-standard ease-smooth"
              >
                <div className="font-medium text-text-light-primary dark:text-text-dark-primary">{note.title || '无标题笔记'}</div>
                <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <WidgetEmptyState
            icon="📝"
            message="暂无笔记内容"
            hint="随时记录你的灵感、知识与想法"
            action={{ label: '新建笔记', onClick: () => navigate('/notes') }}
          />
        )}
        <button
          onClick={() => navigate('/notes')}
          className="w-full mt-auto px-4 py-2.5 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-button text-sm font-medium transition-all duration-standard ease-smooth"
        >
          查看全部笔记 →
        </button>
      </div>
    </BaseWidget>
  );
};
