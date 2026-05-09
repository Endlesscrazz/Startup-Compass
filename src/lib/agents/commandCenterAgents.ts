/**
 * All autonomous agent implementations.
 * Every agent works in demo mode (no API keys required).
 * GROQ_API_KEY enhances explanations but is not required.
 */
import {
  DEFAULT_PERSONAS,
  DEMO_COMPANY_EVENTS,
  DEMO_INVESTOR_PROSPECTS,
  DEMO_TALENT_GAPS,
  getDemoCompanies,
} from "@/lib/agents/demo";
import { completeText } from "@/lib/agents/llm";
import {
  addEvent,
  addNotification,
  addRuleMatch,
  getWatchlist,
  getSavedSearches,
  createGmailDraft,
  createSimulatedSms,
  addAction,
} from "@/lib/agents/agentState";
import {
  employeeRangeMidpoint,
  getHiringLabel,
  getHiringSignalScore,
  scoreCompanyForInvestor,
  scoreCompanyQuality,
  sectorMatchScore,
  stageMatchScore,
  PERSONA_PLANS,
} from "@/lib/agents/scoringHelpers";
import { inferHiringFromDescription } from "@/lib/investor/hiringHeuristic";
import { getPublicSiteUrl } from "@/lib/siteUrl";
import type { Agent, AgentContext, AgentOutput } from "@/lib/agents/types";
import type { Company } from "@/lib/map-config";

// ─── Sticky Match Agent ───────────────────────────────────────────────────────

function createStickyMatchAgent(): Agent {
  return {
    name: "sticky-match",
    description: "Watches your saved searches and fires alerts when companies match your criteria.",
    icon: "📌",
    async run(context: AgentContext) {
      const started = Date.now();
      const searches = getSavedSearches().filter((s) => s.enabled);
      const companies = getDemoCompanies();
      const outputs: AgentOutput[] = [];
      let demo = false;

      for (const search of searches) {
        const critSectors = [
          ...(search.criteria.sector ? [String(search.criteria.sector)] : []),
          ...(Array.isArray(search.criteria.sectors) ? search.criteria.sectors.map(String) : []),
        ];
        const critStages = Array.isArray(search.criteria.stage) ? search.criteria.stage.map(String) : [];
        const critEmployee = search.criteria.employeeRange ? String(search.criteria.employeeRange) : "";

        for (const company of companies) {
          const sectorScore = critSectors.length > 0 ? sectorMatchScore(company.sector, critSectors) : 20;
          const stageScore = critStages.length > 0 ? stageMatchScore(company.stage, critStages) : 15;
          const empScore = critEmployee ? (company.employees === critEmployee ? 20 : 5) : 10;
          const hiringScore = Math.min(15, getHiringSignalScore(company));
          const score = Math.min(100, sectorScore + stageScore + empScore + hiringScore);

          if (score < 45) continue;

          const hiringLabel = getHiringLabel(company);
          const fallback = `${company.name} matches your "${search.name}" alert with a ${score}/100 score. It is a ${company.stage} ${company.sector} company in ${company.city} with ${company.employees} employees and ${hiringLabel.toLowerCase()}.`;

          const llm = await completeText(
            "You are a Utah startup ecosystem intelligence engine. Return only a 2-sentence plain-English explanation of why this company matches the saved search. Be specific about fields. Do not invent data.",
            `Saved search: "${search.name}" — criteria: ${JSON.stringify(search.criteria)}. Company: ${JSON.stringify({ name: company.name, sector: company.sector, stage: company.stage, employees: company.employees, city: company.city, hiringSignal: hiringLabel })}. Match score: ${score}/100.`,
            fallback,
          );
          demo = demo || llm.demo;

          outputs.push({
            type: "match",
            title: company.name,
            subtitle: `${search.name} — ${score}/100 match`,
            body: llm.text,
            score,
            metadata: {
              sector: company.sector,
              stage: company.stage,
              employees: company.employees,
              city: company.city,
              hiringSignal: hiringLabel,
              savedSearch: search.name,
              actions: ["Watch company", "Create Gmail draft", "Send SMS alert"],
            },
            actionLabel: "Watch Company",
            actionUrl: "/map",
          });

          addNotification({
            type: "match",
            title: `${company.name} matched "${search.name}"`,
            body: llm.text,
            entityType: "company",
            entityId: company.id,
            actionUrl: "/briefs-alerts",
            userId: context.userId ?? "demo-user",
          });
        }
      }

      const sorted = outputs.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 12);

      return {
        success: true,
        agentName: "sticky-match",
        outputCount: sorted.length,
        summary: `Found ${sorted.length} company matches across ${searches.length} saved searches. Created ${sorted.length} in-app alerts.`,
        outputs: sorted,
        durationMs: Date.now() - started,
        demo,
      };
    },
  };
}

// ─── Investor Radar Agent ─────────────────────────────────────────────────────

function createInvestorRadarAgent(): Agent {
  return {
    name: "investor-radar",
    description: "Scores all companies for investor attractiveness and generates Why Now briefings.",
    icon: "📈",
    async run() {
      const started = Date.now();
      const companies = getDemoCompanies();
      let demo = false;

      const scored = companies.map((c) => ({
        company: c,
        ...scoreCompanyForInvestor(c),
      }));

      const top10 = [...scored].sort((a, b) => b.total - a.total).slice(0, 10);
      const underRadar = scored.filter((s) => s.total >= 60 && employeeRangeMidpoint(s.company.employees) <= 25 && !top10.includes(s)).slice(0, 3);
      const hiringNow = scored.filter((s) => getHiringSignalScore(s.company) >= 15).slice(0, 5);

      const outputs: AgentOutput[] = [];

      for (const row of top10) {
        const c = row.company;
        const whyNowStr = row.whyNow.join("; ");
        const missingStr = row.missingData.length > 0 ? `Missing: ${row.missingData.join(", ")}.` : "Profile is well-rounded.";

        const fallback = `${c.name} is a ${c.stage} ${c.sector} company in ${c.city} with ${c.employees} employees. Why now: ${whyNowStr}. ${missingStr} Suggested action: add to investor campaign.`;

        const llm = await completeText(
          "Write exactly 3 sentences for an investor briefing card: (1) what they do, (2) why investors should care right now citing specific signals, (3) suggested next action for a seed/growth investor. Use only facts provided.",
          `Company: ${c.name}, Sector: ${c.sector}, Stage: ${c.stage}, Employees: ${c.employees}, City: ${c.city}, Description: ${c.description?.slice(0, 200)}. Investor score: ${row.total}/100. Why now signals: ${whyNowStr}.`,
          fallback,
        );
        demo = demo || llm.demo;

        outputs.push({
          type: "briefing",
          title: c.name,
          subtitle: `${row.label} — ${row.total}/100 · ${c.stage} · ${c.sector}`,
          body: llm.text,
          score: row.total,
          metadata: {
            sector: c.sector,
            stage: c.stage,
            employees: c.employees,
            city: c.city,
            whyNow: row.whyNow,
            missingData: row.missingData,
            collection: "Top 10 Utah Companies to Watch",
            actions: ["Create investor brief", "Add to campaign", "Create Gmail outreach"],
          },
          actionLabel: "Create Investor Brief",
          actionUrl: "/briefs-alerts",
        });
      }

      for (const row of underRadar) {
        const c = row.company;
        outputs.push({
          type: "briefing",
          title: c.name,
          subtitle: `Under the Radar — ${row.total}/100 · ${c.stage} · ${c.sector}`,
          body: `${c.name} is a small but promising ${c.sector} company in ${c.city} with ${c.employees} employees. It scores ${row.total}/100 on investor attractiveness with limited public data — which means early positioning is available for attentive investors.`,
          score: row.total,
          metadata: { sector: c.sector, stage: c.stage, collection: "Under the Radar" },
          actionLabel: "Watch Company",
          actionUrl: "/map",
        });
      }

      for (const row of hiringNow) {
        const c = row.company;
        outputs.push({
          type: "alert",
          title: c.name,
          subtitle: `Hiring Now — ${c.stage} · ${c.sector}`,
          body: `${c.name} is showing active hiring signals in ${c.city}. ${c.stage} ${c.sector} company with ${c.employees} employees. High-growth expansion signals are a strong early investment indicator.`,
          score: row.total,
          metadata: { sector: c.sector, stage: c.stage, collection: "Hiring Now", hiringSignal: getHiringLabel(c) },
          actionLabel: "View Profile",
          actionUrl: "/map",
        });
      }

      return {
        success: true,
        agentName: "investor-radar",
        outputCount: outputs.length,
        summary: `Generated ${top10.length} Why Now briefings, ${underRadar.length} Under the Radar picks, and ${hiringNow.length} Hiring Now alerts. ${demo ? "Demo mode." : ""}`,
        outputs,
        durationMs: Date.now() - started,
        demo,
      };
    },
  };
}

// ─── Founder Growth Agent ─────────────────────────────────────────────────────

function createFounderGrowthAgent(): Agent {
  return {
    name: "founder-growth",
    description: "Generates a persona-specific 30-day operating plan with real Utah resources.",
    icon: "🧭",
    async run(context: AgentContext) {
      const started = Date.now();
      const persona = DEFAULT_PERSONAS.find((p) => p.id === context.personaId) ?? DEFAULT_PERSONAS[0];
      const plan = PERSONA_PLANS[persona.id] ?? PERSONA_PLANS["jordan"];
      let demo = true;

      // Try to enhance the headline with LLM
      const llm = await completeText(
        "You are a Utah startup ecosystem advisor. Write exactly 1 sentence — a powerful focus statement for this founder's next 30 days. Be specific to their stage and situation. No platitudes.",
        `Founder: ${persona.name}. Profile: ${persona.profile}. Stage: ${persona.stage}. Location: ${persona.location}.`,
        plan.diagnosis,
      );
      demo = llm.demo;

      const outputs: AgentOutput[] = [
        {
          type: "plan",
          title: `${persona.name} — 30-Day Operating Plan`,
          subtitle: llm.text,
          body: [
            `**Diagnosis:** ${plan.diagnosis}`,
            `**Funding step:** ${plan.fundingStep}`,
            `**Hiring step:** ${plan.hiringStep}`,
            `**Community:** ${plan.communityStep}`,
          ].join("\n\n"),
          metadata: {
            persona,
            plan,
            weeklyPriorities: plan.weeklyPriorities,
            resources: plan.resources,
            compassActions: plan.compassActions,
            gmailDraft: plan.gmailDraft,
            actions: ["Create Gmail outreach draft", "Set sector alert", "Watch peer companies"],
          },
          actionLabel: "View Full Plan",
          actionUrl: "/briefs-alerts",
        },
      ];

      return {
        success: true,
        agentName: "founder-growth",
        outputCount: outputs.length,
        summary: `Generated a ${persona.stage}-stage operating plan for ${persona.name} with ${plan.resources.length} Utah resources, 4-week priorities, and action items.`,
        outputs,
        durationMs: Date.now() - started,
        demo,
      };
    },
  };
}

// ─── Job Hunter Agent ─────────────────────────────────────────────────────────

function createJobHunterAgent(): Agent {
  return {
    name: "job-hunter",
    description: "Finds companies with hiring signals and creates opportunity cards even when explicit postings are unavailable.",
    icon: "🎯",
    async run() {
      const started = Date.now();
      const companies = getDemoCompanies();

      // Score all companies for hiring signal
      const opportunities = companies
        .map((c) => {
          const hiringScore = getHiringSignalScore(c);
          const hiringLabel = getHiringLabel(c);
          const descHasHiring = inferHiringFromDescription(c.description);
          const mid = employeeRangeMidpoint(c.employees);

          const fitScore =
            hiringScore * 2 +
            (c.sector === "B2B Software" ? 15 : 10) +
            (["Series A", "Series B", "Seed"].includes(c.stage) ? 15 : 5) +
            (mid >= 11 ? 10 : 5);

          return {
            company: c,
            fitScore: Math.min(100, fitScore),
            hiringLabel,
            opportunityType: c.hiringStatus === "hiring" ? "Active job posting" :
              descHasHiring ? "Hiring signal (from description)" : "Company opportunity",
          };
        })
        .filter((o) => o.fitScore >= 35)
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 12);

      const outputs: AgentOutput[] = opportunities.map((o) => {
        const roleEstimate = o.company.sector === "B2B Software" ? "Software Engineer / Product" :
          o.company.sector === "Bio/Medical Tech" ? "Research Scientist / Regulatory Affairs" :
          o.company.sector === "FinTech" ? "Software Engineer / Financial Analyst" :
          o.company.sector === "Security" ? "Security Engineer / Penetration Tester" :
          "General / Operations";

        return {
          type: "alert",
          title: `${o.company.name} — ${roleEstimate}`,
          subtitle: `${o.company.city} · ${o.company.stage} · ${o.company.employees} employees`,
          body: `${o.opportunityType}: ${o.company.name} is a ${o.company.stage} ${o.company.sector} company in ${o.company.city}. ${o.hiringLabel}. ${o.company.description?.slice(0, 120) ?? ""} This is a curated opportunity card — visit the company website to find active openings.`,
          score: o.fitScore,
          metadata: {
            sector: o.company.sector,
            stage: o.company.stage,
            employees: o.company.employees,
            city: o.company.city,
            opportunityType: o.opportunityType,
            roleEstimate,
            website: o.company.website,
            actions: ["Add to watchlist", "Create Gmail draft", "Set job alert"],
          },
          actionLabel: "Visit Company",
          actionUrl: o.company.website ?? "/map",
        };
      });

      return {
        success: true,
        agentName: "job-hunter",
        outputCount: outputs.length,
        summary: `Found ${outputs.length} companies with active hiring signals or strong opportunity indicators. Cards show opportunity type — not fabricated job listings.`,
        outputs,
        durationMs: Date.now() - started,
        demo: true,
      };
    },
  };
}

// ─── Investor Campaign Agent ──────────────────────────────────────────────────

function createInvestorCampaignAgent(): Agent {
  return {
    name: "investor-campaign",
    description: "Builds personalized investor outreach campaigns with Gmail drafts queued for review.",
    icon: "✉️",
    async run() {
      const started = Date.now();
      const companies = getDemoCompanies();
      let demo = false;

      // Select top 3 companies per sector for the campaign
      const bySection: Record<string, Company[]> = {};
      for (const c of companies) {
        if (!bySection[c.sector]) bySection[c.sector] = [];
        if (bySection[c.sector].length < 3) bySection[c.sector].push(c);
      }

      const campaigns = [
        { name: "Utah B2B Software — Q2 Briefing", sector: "B2B Software", targetType: "Seed/Series A VC" },
        { name: "Utah Bio/Medical Tech Dealflow", sector: "Bio/Medical Tech", targetType: "Healthcare VC" },
        { name: "Utah FinTech & Security Digest", sector: "FinTech", targetType: "Fintech investor" },
      ];

      const outputs: AgentOutput[] = [];
      for (const campaign of campaigns) {
        const companyList = (bySection[campaign.sector] ?? []).slice(0, 3);
        const companyNames = companyList.map((c) => `${c.name} (${c.stage})`).join(", ");

        const fallbackBody = `Dear [Investor],\n\nWe are sharing a focused Utah ${campaign.sector} market briefing featuring ${companyNames}. These companies align well with a ${campaign.targetType} thesis and are demonstrating early momentum.\n\nWould you be open to a 30-minute conversation next week?\n\n— Utah Startup Compass\n\n[Status: Queued for human review before sending]`;

        const llm = await completeText(
          "Write a personalized 150-word investor prospecting email body (no greeting, no sign-off). Reference the specific companies and why they fit the investor type. End with a low-friction ask.",
          `Campaign: ${campaign.name}. Target: ${campaign.targetType}. Companies: ${companyNames}. Sector: ${campaign.sector}.`,
          fallbackBody,
        );
        demo = demo || llm.demo;

        // Create simulated Gmail draft
        const draftSubject = `${campaign.name} — Utah Startup Compass`;
        createGmailDraft({
          userId: "demo-user",
          subject: draftSubject,
          body: llm.text,
          draftType: "investor_outreach",
          status: "simulated",
          linkedEntityId: campaign.sector,
        });

        outputs.push({
          type: "campaign",
          title: campaign.name,
          subtitle: `${campaign.targetType} · ${DEMO_INVESTOR_PROSPECTS.slice(0, 5).map((p) => p.name).join(", ")}`,
          body: `${llm.text.slice(0, 250)}...\n\n[Campaign queued for human review. Gmail draft created.]`,
          metadata: {
            sector: campaign.sector,
            companies: companyNames,
            targetType: campaign.targetType,
            status: "queued_for_review",
            gmailDraftCreated: true,
            actions: ["Review draft", "Add recipients", "Schedule send"],
          },
          actionLabel: "Review Draft",
          actionUrl: "/briefs-alerts",
        });

        addAction({
          actionType: "gmail_draft",
          status: "simulated",
          payload: { subject: draftSubject, campaign: campaign.name, sector: campaign.sector },
          result: { status: "queued_for_review" },
          ruleMatchId: undefined,
        });
      }

      return {
        success: true,
        agentName: "investor-campaign",
        outputCount: outputs.length,
        summary: `Prepared ${outputs.length} investor outreach campaigns with Gmail drafts created (queued for review, not sent).`,
        outputs,
        durationMs: Date.now() - started,
        demo,
      };
    },
  };
}

// ─── Talent Attraction Agent ──────────────────────────────────────────────────

function createTalentAttractionAgent(): Agent {
  return {
    name: "talent-attraction",
    description: "Analyzes talent gaps across Utah sectors and generates campaign recommendations.",
    icon: "🧲",
    async run() {
      const started = Date.now();
      const companies = getDemoCompanies();

      const byMedSector: Record<string, number> = {};
      for (const c of companies) {
        byMedSector[c.sector] = (byMedSector[c.sector] ?? 0) + 1;
      }

      const outputs: AgentOutput[] = DEMO_TALENT_GAPS.map((gap) => {
        const companyCount = byMedSector[gap.sector] ?? 0;
        return {
          type: "briefing",
          title: `${gap.sector}: ${gap.role}`,
          subtitle: `~${gap.gap} open roles estimated · ${companyCount} Utah companies in this sector`,
          body: `Utah has ${companyCount} ${gap.sector} companies on the map. The estimated talent gap for ${gap.role} is ${gap.gap} roles. Top talent source cities: ${gap.sources}. Recommended pitch angle: "Build the same products with better work-life balance, lower cost of living, and a tight-knit founder community." Key advantage: BYU, U of U, and USU pipeline provides consistent junior talent inflow.`,
          metadata: {
            sector: gap.sector,
            role: gap.role,
            estimatedGap: gap.gap,
            sources: gap.sources,
            utahCompanyCount: companyCount,
            actions: ["Export talent pitch", "Create campaign", "Set hiring alert"],
          },
          actionLabel: "Export Talent Pitch",
          actionUrl: "/briefs-alerts",
        };
      });

      return {
        success: true,
        agentName: "talent-attraction",
        outputCount: outputs.length,
        summary: `Produced ${outputs.length} talent gap analysis cards. Identified key hiring markets and pitch angles for each Utah sector.`,
        outputs,
        durationMs: Date.now() - started,
        demo: true,
      };
    },
  };
}

// ─── Data Quality Agent ───────────────────────────────────────────────────────

function createDataQualityAgent(): Agent {
  return {
    name: "data-quality",
    description: "Scores every company profile and generates specific improvement recommendations.",
    icon: "🧪",
    async run() {
      const started = Date.now();
      const companies = getDemoCompanies();

      const scoredAll = companies.map((c) => ({ company: c, ...scoreCompanyQuality(c) }));
      const sorted = [...scoredAll].sort((a, b) => b.total - a.total);

      // Show top 10 and worst 5 for contrast
      const top10 = sorted.slice(0, 10);
      const worst5 = sorted.slice(-5);
      const toShow = [...top10, ...worst5];

      const outputs: AgentOutput[] = toShow.map(({ company: c, total, label, strongFields, missingFields, staleFields, topRecommendation }) => ({
        type: "score",
        title: c.name,
        subtitle: `${label} — ${total}/100 · ${c.sector} · ${c.stage}`,
        body: `${c.name} scored ${total}/100. Strong: ${strongFields.slice(0, 3).join(", ") || "none"}. Missing: ${missingFields.slice(0, 3).join(", ") || "none"}. ${staleFields.length > 0 ? `Stale: ${staleFields[0]}.` : ""} Next step: ${topRecommendation}`,
        score: total,
        metadata: {
          sector: c.sector,
          stage: c.stage,
          employees: c.employees,
          city: c.city,
          strongFields,
          missingFields,
          staleFields,
          topRecommendation,
          actions: ["Create admin task", "Generate Gmail to owner", "Add update badge"],
        },
        actionLabel: missingFields.includes("Verified profile") ? "Claim Profile" : "Update Profile",
        actionUrl: c.website ?? "/map",
      }));

      const avgScore = Math.round(scoredAll.reduce((s, r) => s + r.total, 0) / scoredAll.length);
      const needWork = scoredAll.filter((r) => r.total < 65).length;
      const investorReady = scoredAll.filter((r) => r.total >= 85).length;

      return {
        success: true,
        agentName: "data-quality",
        outputCount: outputs.length,
        summary: `Scored ${companies.length} company profiles. Avg: ${avgScore}/100. Investor Ready: ${investorReady}. Needs Work: ${needWork}. Showing top 10 and bottom 5 for contrast.`,
        outputs,
        durationMs: Date.now() - started,
        demo: true,
      };
    },
  };
}

// ─── Company Watch Agent ──────────────────────────────────────────────────────

function createCompanyWatchAgent(): Agent {
  return {
    name: "company-watch",
    description: "Watches companies for meaningful changes, creates alerts, and notifies users through rules.",
    icon: "👁️",
    async run(context: AgentContext) {
      const started = Date.now();
      const watchlist = getWatchlist(context.userId ?? "demo-user");
      const outputs: AgentOutput[] = [];
      const demo = true;

      // Process demo events (deterministic — based on real company data)
      for (const demoEvent of DEMO_COMPANY_EVENTS) {
        const event = addEvent({
          entityType: "company",
          entityId: demoEvent.companyId,
          eventType: demoEvent.eventType,
          newValue: { change: demoEvent.change },
          source: "demo",
          metadata: {
            companyName: demoEvent.companyName,
            sector: demoEvent.sector,
            stage: demoEvent.stage,
            city: demoEvent.city,
            priority: demoEvent.priority,
          },
        });

        const isWatched = watchlist.some((w) => w.companyId === demoEvent.companyId);
        const matchScore = demoEvent.priority === "high" ? 90 : demoEvent.priority === "medium" ? 70 : 50;

        addRuleMatch({
          ruleId: "rule-b2b-hiring",
          eventId: event.id,
          userId: context.userId ?? "demo-user",
          matchScore,
          reasons: [demoEvent.change, demoEvent.whyMatters],
          status: "new",
        });

        addNotification({
          type: "company_change",
          title: `${demoEvent.companyName}: ${demoEvent.change}`,
          body: demoEvent.whyMatters,
          entityType: "company",
          entityId: demoEvent.companyId,
          actionUrl: "/briefs-alerts",
          userId: context.userId ?? "demo-user",
        });

        // Create Gmail draft for high-priority events
        if (demoEvent.priority === "high") {
          createGmailDraft({
            userId: context.userId ?? "demo-user",
            subject: `Startup Compass Alert: ${demoEvent.companyName} — ${demoEvent.change}`,
            body: `Company: ${demoEvent.companyName}\nChange: ${demoEvent.change}\nWhy it matters: ${demoEvent.whyMatters}\nWho cares: ${demoEvent.whoCares}\nSuggested action: ${demoEvent.action}\n\n[Demo draft — connect Gmail to create real drafts]`,
            draftType: "company_alert",
            status: "simulated",
            linkedEntityId: demoEvent.companyId,
          });

          addAction({
            actionType: "gmail_draft",
            status: "simulated",
            payload: { companyName: demoEvent.companyName, change: demoEvent.change },
            result: { note: "Simulated Gmail draft created" },
            ruleMatchId: undefined,
          });
        }

        // SMS for high-priority watched companies
        if (demoEvent.priority === "high" && isWatched) {
          createSimulatedSms({
            userId: context.userId ?? "demo-user",
            to: "+1-555-0100 (demo)",
            body: `Startup Compass: ${demoEvent.companyName} — ${demoEvent.change.slice(0, 80)}. View: ${getPublicSiteUrl()}/briefs-alerts`,
            messageType: "company_alert",
            status: "simulated",
            linkedEntityId: demoEvent.companyId,
          });
        }

        outputs.push({
          type: "notification",
          title: demoEvent.companyName,
          subtitle: `${demoEvent.priority.toUpperCase()} PRIORITY · ${demoEvent.sector} · ${demoEvent.stage}`,
          body: `Change: ${demoEvent.change}\nWhy it matters: ${demoEvent.whyMatters}\nWho should care: ${demoEvent.whoCares}\nSuggested action: ${demoEvent.action}${demoEvent.priority === "high" ? "\n\n[Gmail draft created · SMS simulated]" : isWatched ? "\n[Watched company]" : ""}`,
          score: matchScore,
          metadata: {
            eventType: demoEvent.eventType,
            sector: demoEvent.sector,
            stage: demoEvent.stage,
            city: demoEvent.city,
            priority: demoEvent.priority,
            watched: isWatched,
            actions: ["Dismiss", "Watch company", "Create investor brief", "Create Gmail draft"],
          },
          actionLabel: "View Company",
          actionUrl: "/map",
        });
      }

      // Also show watchlist companies with status
      const companies = getDemoCompanies();
      for (const watched of watchlist.slice(0, 3)) {
        const company = companies.find((c) => c.id === watched.companyId);
        if (!company) continue;
        outputs.push({
          type: "alert",
          title: `[Watching] ${company.name}`,
          subtitle: `${company.sector} · ${company.stage} · No new changes`,
          body: `${company.name} is on your watchlist. Current status: ${company.stage} stage, ${company.employees} employees in ${company.city}. ${getHiringLabel(company)}. No significant changes detected since last run.`,
          metadata: { sector: company.sector, stage: company.stage, watched: true },
          actionLabel: "Unwatch",
          actionUrl: "/briefs-alerts",
        });
      }

      const gmailCount = DEMO_COMPANY_EVENTS.filter((e) => e.priority === "high").length;
      const smsCount = DEMO_COMPANY_EVENTS.filter((e) => e.priority === "high" && watchlist.some((w) => w.companyId === e.companyId)).length;

      return {
        success: true,
        agentName: "company-watch",
        outputCount: outputs.length,
        summary: `Detected ${DEMO_COMPANY_EVENTS.length} company changes. Created ${DEMO_COMPANY_EVENTS.length} in-app alerts, ${gmailCount} Gmail drafts (simulated), and ${smsCount} SMS alerts (simulated). ${watchlist.length} companies on watchlist.`,
        outputs,
        durationMs: Date.now() - started,
        demo,
      };
    },
  };
}

// ─── Digest Agent ─────────────────────────────────────────────────────────────

function createDigestAgent(): Agent {
  return {
    name: "digest",
    description: "Generates a personalized weekly digest with your top matches, watched companies, and ecosystem updates.",
    icon: "📰",
    async run(context: AgentContext) {
      const started = Date.now();
      const companies = getDemoCompanies();
      let demo = true;

      const topByScore = companies
        .map((c) => ({ company: c, ...scoreCompanyForInvestor(c) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const hiringSignals = companies
        .filter((c) => getHiringSignalScore(c) >= 15)
        .slice(0, 3);

      const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      const digestBody = [
        `**Utah Startup Compass — Weekly Digest (${date})**`,
        "",
        `**Top Companies This Week:**`,
        ...topByScore.map((r) => `• ${r.company.name} (${r.company.sector}, ${r.company.stage}) — ${r.total}/100 score`),
        "",
        `**Hiring Signals Detected:**`,
        ...hiringSignals.map((c) => `• ${c.name} (${c.sector}, ${c.city}) — ${getHiringLabel(c)}`),
        "",
        `**Ecosystem Pulse:**`,
        `• ${DEMO_COMPANY_EVENTS.length} company changes detected this week`,
        `• ${companies.filter((c) => c.sector === "B2B Software").length} B2B Software companies in the Atlas`,
        `• ${companies.filter((c) => c.stage === "Seed").length} Seed-stage companies tracked`,
        "",
        `[View full digest: ${getPublicSiteUrl()}/briefs-alerts]`,
      ].join("\n");

      // Create Gmail digest draft
      createGmailDraft({
        userId: context.userId ?? "demo-user",
        subject: `Your Utah Startup Watchlist Digest — ${date}`,
        body: digestBody,
        draftType: "weekly_digest",
        status: "simulated",
      });

      addAction({
        actionType: "weekly_digest_item",
        status: "simulated",
        payload: { date, topCompanies: topByScore.length, hiringSignals: hiringSignals.length },
        result: { note: "Simulated Gmail digest draft created" },
        ruleMatchId: undefined,
      });

      const outputs: AgentOutput[] = [
        {
          type: "briefing",
          title: `Weekly Digest — ${date}`,
          subtitle: `${topByScore.length} top companies · ${hiringSignals.length} hiring signals · ${DEMO_COMPANY_EVENTS.length} changes`,
          body: digestBody,
          metadata: {
            digestDate: date,
            topCompanies: topByScore.map((r) => r.company.name),
            hiringSignals: hiringSignals.map((c) => c.name),
            gmailDraftCreated: true,
            actions: ["Send now (requires Gmail)", "Schedule weekly", "View in browser"],
          },
          actionLabel: "View Full Digest",
          actionUrl: "/briefs-alerts",
        },
      ];

      demo = true; // always demo for digest agent

      return {
        success: true,
        agentName: "digest",
        outputCount: outputs.length,
        summary: `Generated weekly digest with ${topByScore.length} company highlights and ${hiringSignals.length} hiring signals. Gmail draft created (simulated).`,
        outputs,
        durationMs: Date.now() - started,
        demo,
      };
    },
  };
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export function getCommandCenterAgents(): Agent[] {
  return [
    createStickyMatchAgent(),
    createInvestorRadarAgent(),
    createFounderGrowthAgent(),
    createJobHunterAgent(),
    createInvestorCampaignAgent(),
    createTalentAttractionAgent(),
    createDataQualityAgent(),
    createCompanyWatchAgent(),
    createDigestAgent(),
  ];
}

export function getPersonaById(id?: string) {
  return DEFAULT_PERSONAS.find((p) => p.id === id) ?? DEFAULT_PERSONAS[0];
}
