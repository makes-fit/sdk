export interface PartialRagnar {
  name: string;
  year: number;
  teamSize: number;
  balanced: boolean;
}

export interface Ragnar extends PartialRagnar {
  id: string | undefined;
  distance: number;
  legs: RagnarLeg[];
}

export interface RagnarLeg {
  difficulty: string;
  distance: number;
  pos: number;
  slot: number;
  seq: number;
  startMile: number;
  endMile: number;
}

interface serverRagnar {
  _id: any;
  name: string;
  year: number;
  year_size: number;
  distance: number;
  legs: serverRagnarLeg[];
  balanced: boolean;
}

interface serverRagnarLeg {
  difficulty: string;
  distance: number;
  pos: number;
  slot: number;
  seq: number;
  start_mile: number;
  end_mile: number;
}


export function toRagnarPayload(ragnar: PartialRagnar) {
  return {
    name: ragnar.name,
    year: ragnar.year,
    team_size: ragnar.teamSize,
    balanaced: ragnar.balanced,
  }
}
