# The Insiders Lab Platform — START HIER

> **Dit document lees je eerst, voor elke andere.** Het legt uit welke repo je aan het bouwen bent en welke niet.

## Twee aparte repo's

Dit project bestaat uit **twee volledig aparte git-repo's** die los van elkaar worden gebouwd, versievast zijn, en los worden deployed. Ze communiceren via het Model Context Protocol (MCP) over het netwerk.

```
┌─────────────────────────────────┐      ┌───────────────────────────────┐
│ REPO 1: insiders-lab-mcps           │      │ REPO 2: insiders-lab-platform    │
│ (pnpm monorepo met vijf MCPs)       │◄─────│ (Next.js 15 app met agents)      │
│                                     │ MCP  │                                  │
│ - mcp-trades                        │ HTTP │ - Signal Agent                   │
│ - mcp-market-intel                  │      │ - Analyst Agent                  │
│ - mcp-content-memory                │      │ - Profiler Agent                 │
│ - mcp-publisher                     │      │ - Historian Agent                │
│ - mcp-video-pipeline                │      │ - Editor Agent                   │
│ - @insiders-lab/shared              │      │ - Community Agent                │
│                                     │      │ - Growth Analyst                 │
│ Plan: MCP_PLAN.md                   │      │ - Video Agent                    │
│                                     │      │                                  │
│                                     │      │ Plan: AGENT_PLATFORM.md          │
│                                     │      │ Brand voice: brand-voice.md      │
└─────────────────────────────────┘      └───────────────────────────────┘
```

## Welke repo ben je aan het bouwen?

Kijk naar welk plan-document je aan het lezen bent.

**Lees je `MCP_PLAN.md`?** Dan ben je in **Repo 1: insiders-lab-mcps**. Je bouwt daar de vijf MCP-servers. Je bouwt daar GEEN agents, GEEN Next.js app, GEEN dashboard. Als het plan agents noemt zijn dat alleen de *consumers* van jouw MCPs. Die leven in de andere repo.

**Lees je `AGENT_PLATFORM.md`?** Dan ben je in **Repo 2: insiders-lab-platform**. Je bouwt daar de Next.js app met acht agents, dashboards, workers. Je bouwt daar GEEN MCPs. Als het plan MCPs noemt (bijvoorbeeld `mcp-trades`), dan zijn dat *externe netwerkservices* waar jouw agents clients voor hebben. Jouw agents roepen die MCPs aan via HTTP.

## Wat importeert wat

Repo 1 (insiders-lab-mcps) exporteert:
- Elke MCP als losse `@insiders-lab/mcp-<naam>` npm package
- Shared types als `@insiders-lab/shared` npm package
- Draait als één of meerdere HTTP-servers op poorten 8201 t/m 8205

Repo 2 (insiders-lab-platform) importeert:
- `@insiders-lab/shared` als dependency voor type-safety
- Praat over HTTP met de MCP-servers via typed clients in `lib/mcp-clients/`
- Bouwt zelf geen MCPs

In de eerste fase kun je beide repo's in dezelfde pnpm-workspace zetten als dat handiger is voor lokale development. Maar behandel ze als twee aparte deployable units met aparte versionering en CHANGELOGs.

## Bouwvolgorde tussen de repo's

Bouw **Repo 1 eerst**. Zonder werkende MCPs kan Repo 2 niet draaien behalve tegen mock-clients. De sprint-volgorde is:

1. **Repo 1 Sprint 1**: `mcp-trades` met Mock + Supabase adapter. Test via Claude Desktop.
2. **Repo 1 Sprint 2**: `mcp-content-memory` + `mcp-publisher`.
3. **Repo 2 Sprint 1** kan starten: Next.js skeleton + Signal Agent + Analyst Agent, nu tegen echte `mcp-trades` en tegen mock-clients voor de rest.
4. Vanaf hier ga je de sprints afwisselen op basis van wat blokkeert.

## Shared package is de brug

`@insiders-lab/shared` bevat alle Zod-schemas voor domein-entiteiten (Trade, InsiderProfile, QueueItem, PipelineStatus, etc.). Beide repo's importeren deze schemas. Dat is de single source of truth.

Als een schema verandert in Repo 1 (bijvoorbeeld een nieuw veld in `TradeDetail`), bump je de versie, publish je naar een intern npm-registry of via git-tag, en de Repo 2 update de dependency. Dat is *hoe* de repo-scheiding werkt zonder dat ze uit sync lopen.

## Voor Claude Code sessies: waar ben ik?

Als je een nieuwe sessie opent en niet weet welk deel van het systeem je aan het bouwen bent:

1. Check de package.json in je working directory. Staat daar `"name": "@insiders-lab/mcp-..."` of `"name": "@insiders-lab/platform"`?
2. Check of er een `next.config.js` is. Zo ja, je zit in Repo 2.
3. Check of er een `packages/mcp-*` folder-structuur is. Zo ja, je zit in Repo 1.
4. Lees het plan-document dat erbij hoort (`MCP_PLAN.md` of `AGENT_PLATFORM.md`).

**Veelvoorkomende valkuil:** als het plan-document een sectie "MCP-trades" beschrijft en je bent in Repo 2, ga die MCP dan NIET bouwen. Schrijf in plaats daarvan een typed HTTP-client in `lib/mcp-clients/trades.ts` die aanneemt dat de MCP al draait op poort 8201.

## Wat je NIET moet doen

- Niet alle vijf MCPs in de Next.js `lib/` folder bouwen.
- Niet de agent-logica in een van de MCPs stoppen.
- Niet één gecombineerde repo maken ondanks dat het makkelijker lijkt. De scheiding is de hele reden dat dit platform schaalbaar en onderhoudbaar blijft.
- Niet afwijken van de sprint-volgorde binnen een repo. Elke sprint heeft een exit-criterium, bouw niet vooruit.

## Als iets onduidelijk is

Stop en vraag. Bouw niet "voor de zekerheid" iets dat niet in het plan staat. De plannen zijn expliciet ingericht op wat er wel EN wat er niet gebouwd moet worden. Als jouw instinct zegt "dit ontbreekt, ik voeg het toe", is de kans groot dat het bewust weggelaten is.
