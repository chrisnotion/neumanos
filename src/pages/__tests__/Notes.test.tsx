import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Notes } from '../Notes';
import { useNotesStore } from '../../stores/useNotesStore';
import { useFoldersStore } from '../../stores/useFoldersStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

describe('Notes Page Render', () => {
  beforeEach(() => {
    useNotesStore.setState({ notes: {}, activeNoteId: null });
    useFoldersStore.setState({ folders: {}, activeFolderId: null });
  });

  it('renders Notes page without crashing when empty', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/notes']}>
        <Notes />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
  });

  it('renders Notes page with an active note', () => {
    const note = useNotesStore.getState().createNote({
      title: '⚡ 闪念便签 (Quick Note)',
      contentText: 'Test content',
      content: '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Test content","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
      tags: ['ai-terminal', 'quick-note'],
      isQuickNote: true,
    });

    useNotesStore.setState({ activeNoteId: note.id });

    const { container } = render(
      <MemoryRouter initialEntries={['/notes']}>
        <Notes />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
  });
});
