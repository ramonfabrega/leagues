type LevelsResponse = {
  username: string;
  levels: {
    [skill: string]: number;
  };
};

(async () => {
    await run();
})();

async function run() {
  const rmn = await fetchLevels("rmn69");
  const capo = await fetchLevels("elcapo42069");

  const compared = compareLevels({ rmn, capo });
//   console.log(capo);
  console.log(compared);
}

function compareLevels({ rmn, capo }: Record<"rmn" | "capo", LevelsResponse>) {
    const skillsToHighlight = [];
  
    // Assuming rmn.levels and capo.levels are objects with skill names as keys and levels as values
    for (const skill in rmn.levels) {
      if (capo.levels.hasOwnProperty(skill)) {
        const rmnLevel = rmn.levels[skill];
        const capoLevel = capo.levels[skill];
  
        const lowerLevel = Math.min(rmnLevel, capoLevel);
        const higherLevel = Math.max(rmnLevel, capoLevel);
        const levelDifference = higherLevel - lowerLevel;
  
        if (
          (lowerLevel <= 50 && levelDifference >= 7) ||
          (lowerLevel > 50 && lowerLevel <= 80 && levelDifference >= 5) ||
          (lowerLevel > 80 && levelDifference >= 3)
        ) {
            const skillInfo = {
                [skill]: {
                  rmn: rmnLevel,
                  elcapo: capoLevel
                }
              };
              skillsToHighlight.push(skillInfo);
            }
      }
    }
  
    return skillsToHighlight;
  }

async function fetchLevels(rsn: string) {
  const res = await fetch(
    `https://sync.runescape.wiki/runelite/player/${rsn}/TRAILBLAZER_RELOADED_LEAGUE`
  );

  const { username, levels } = (await res.json()) as LevelsResponse;

  return { username, levels };
}