import { prepareExample, runBattle } from './lib/scenario.mjs'
const example = await prepareExample()
try {
  console.log(`Package: ${example.manifest.name}`)
  console.log(`Namespace: ${example.manifest.arcadia.namespace}`)
  console.log(`Environment: ${example.environment.revision}`)
  const result = await runBattle(example.createBattle(), (battle) => {
    const pets = [battle.playerA, battle.playerB].map(
      (player) =>
        `${player.name}: HP ${player.activePet.currentHp}, speed ${player.activePet.stat.spe}, marks ${player.activePet.marks.length}`,
    )
    console.log(`Turn ${battle.currentTurn}: ${pets.join(' | ')}`)
  })
  console.log(`Winner: ${result.winner}; finished in ${result.turns} turns.`)
} finally {
  await example.dispose()
}
