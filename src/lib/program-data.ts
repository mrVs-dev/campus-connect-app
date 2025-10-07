
export type ProgramLevel = {
    name: string;
    levels: string[];
};

export type Program = {
    id: string;
    name: string;
    subDivisions?: ProgramLevel[];
    levels?: string[];
};

export const programs: Program[] = [
    {
        id: 'english-international',
        name: 'English International',
        subDivisions: [
            {
                name: 'Lower School',
                levels: ['DayCare', 'Toddler', 'Pre-K', 'Kindergarten'],
            },
            {
                name: 'Primary School',
                levels: [
                    'Grade 01', 'Grade 02', 'Grade 03', 'Grade 04', 'Grade 05', 'Grade 06'
                ],
            },
            {
                name: 'High School',
                levels: [
                    'Grade 07', 'Grade 08', 'Grade 09', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'
                ],
            },
        ],
    },
    {
        id: 'khmer-national',
        name: 'Khmer National',
        subDivisions: [
            {
                name: 'Lower School',
                levels: ['DayCare', 'Toddler', 'Pre-K', 'Kindergarten'],
            },
            {
                name: 'Primary School',
                levels: [
                    'Grade 01', 'Grade 02', 'Grade 03', 'Grade 04', 'Grade 05', 'Grade 06'
                ],
            },
            {
                name: 'High School',
                levels: [
                    'Grade 07', 'Grade 08', 'Grade 09', 'Grade 10', 'Grade 11', 'Grade 12'
                ],
            },
        ],
    },
    {
        id: 'esl',
        name: 'English as Second Language (ESL)',
        levels: [
            'Starters', 'Level 01', 'Level 02', 'Level 03', 'Level 04', 'Level 05', 'Level 06'
        ],
    },
    {
        id: 'csl',
        name: 'Chinese as Second Language (CSL)',
        levels: [
            'Starters', 'Level 01', 'Level 02', 'Level 03', 'Level 04', 'Level 05', 'Level 06'
        ],
    },
];

export const getLevelsForProgram = (programId: string): string[] => {
    const program = programs.find(p => p.id === programId);
    if (!program) return [];

    if (program.levels) {
        return program.levels;
    }

    if (program.subDivisions) {
        return program.subDivisions.flatMap(sd => sd.levels);
    }

    return [];
};
