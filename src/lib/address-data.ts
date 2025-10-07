
export type Commune = {
  id: string;
  name: string;
  villages: string[];
};

export const communes: Commune[] = [
  { id: "171001", name: "Sla Kram", villages: ["Sla Kram", "Dol Po", "Damnak", "Trapeang Seh", "Taphul", "Boeng Dounhpa", "Thlok Andong", "Chongkaosou"] },
  { id: "171002", name: "Svay Dangkum", villages: ["Svay Dangkum", "Krous", "Ta Vearn", "Taphul", "Krom", "Vihear Chen", "Svay", "Prey", "Pou", "Banteaychey", "Sangkat", "Steung Thmey", "Mondul 1", "Mondul 2"] },
  { id: "171003", name: "Kouk Chak", villages: ["Kouk Chak", "Kouk Tnaot", "Trapeang Ses", "Thmei", "Srangae"] },
  { id: "171004", name: "Sala Kamreuk", villages: ["Sala Kamreuk", "Wat Bo", "Chongkaosou", "Wat Damnak", "Krom"] },
  { id: "171005", name: "Nokor Thum", villages: ["Nokor Krau", "Nokor Knong", "Trapeang Ses", "Rohal"] },
  { id: "171006", name: "Chreav", villages: ["Chreav", "Krabie Riel", "Pong Tuek"] },
  { id: "171007", name: "Chong Knies", villages: ["Chong Knies"] },
  { id: "171008", name: "Sambuor", villages: ["Sambuor", "Prey Kuy", "Pou Banteaychey"] },
  { id: "171009", name: "Siem Reab", villages: ["Mondul Muoy", "Mondul Pir", "Mondul Bei", "Wat Bo", "Krom"] },
  { id: "171010", name: "Srangae", villages: ["Srangae", "Krabie Riel", "Pong Tuek"] },
  { id: "171011", name: "Ampil", villages: ["Ampil", "Krabie Riel", "Pong Tuek"] },
  { id: "171012", name: "Krabie Riel", villages: ["Krabie Riel", "Pong Tuek", "Chreav"] },
  { id: "171013", name: "Tuek Vil", villages: ["Tuek Vil", "Trapeang Ses", "Rohal"] }
];

export const getVillagesByCommune = (communeName: string): string[] => {
  const commune = communes.find(c => c.name === communeName);
  return commune ? commune.villages : [];
};

    