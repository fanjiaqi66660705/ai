export interface BpRound {
  dimension: string;
  question: string;
  answer: string;
}

export interface BpSession {
  id: string;
  title: string;
  bpText: string;
  rounds: BpRound[];
  done: boolean;
}

const sessions = new Map<string, BpSession>();

export const bpStore = {
  create(title: string, bpText: string): BpSession {
    const id = "bp" + Date.now();
    const s: BpSession = { id, title, bpText, rounds: [], done: false };
    sessions.set(id, s);
    return s;
  },
  get(id: string): BpSession | undefined {
    return sessions.get(id);
  },
  addRound(id: string, round: BpRound) {
    const s = sessions.get(id);
    if (!s) return;
    s.rounds.push(round);
    if (s.rounds.length >= 5) s.done = true;
  },
};
