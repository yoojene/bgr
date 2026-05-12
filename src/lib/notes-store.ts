export type StoredCrewNote = {
  name: string;
  crewNote: string;
  updatedAt: string | null;
};

const globalStore = globalThis as typeof globalThis & {
  __bgrCrewNotes?: Map<string, StoredCrewNote>;
};

function getStore() {
  if (!globalStore.__bgrCrewNotes) {
    globalStore.__bgrCrewNotes = new Map<string, StoredCrewNote>();
  }

  return globalStore.__bgrCrewNotes;
}

export function listCrewNotes() {
  return Array.from(getStore().values());
}

export function saveCrewNote(name: string, crewNote: string) {
  const nextValue: StoredCrewNote = {
    name,
    crewNote,
    updatedAt: new Date().toISOString(),
  };

  getStore().set(name, nextValue);
  return nextValue;
}